import { PaintQueueRedisEnvironment } from "./Loaders"
import { DynamicModule } from "@nestjs/common"

import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"
import { SharedBlockstoresModule } from "./SharedBlockstoresModule.js"

import { PaintingModuleTypes } from "../../../painting/artwork/di/Types.js"
import { RandomArtProvider } from "../../../painting/artwork/components/RandomArtProvider.js"
import { PaintingModule } from "../../../painting/artwork/di/Module.js"
import { QueueingPaintModule } from "../../../painting/queue/di/Module.js"

import { PlottingModuleTypes } from "../../../plotting/di/Types.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"
import { IpldPlottingModule } from "../../../plotting/ipld/di/Module.js"

import { ConfigService } from "@nestjs/config"

export function appModuleImports(
   configSvc: ConfigService,
): Record<"queueModule" | "paintingModule" | "plottingModule", DynamicModule> {
   const plottingModule: DynamicModule = IpldPlottingModule.forRoot({
      blockStore: {
         use: "token",
         for: "value",
         module: SharedBlockstoresModule,
         token: SharedBlockstoresModuleTypes.RegionMapBlockstore,
      },
   })

   const paintingModule: DynamicModule = PaintingModule.forRoot({
      regionMapRepo: {
         use: "token",
         for: "value",
         module: plottingModule,
         token: PlottingModuleTypes.IRegionMapRepository,
      },
      genModelProvider: {
         use: "value",
         value: new RandomArtProvider(),
      },
   })

   const retention = configSvc.get("paintQueueRetention")
   const redis: PaintQueueRedisEnvironment = configSvc.get(
      "PaintQueueRedisEnvironment",
   ) ?? { host: "localhost", port: 6336 }
   const paintAppRole = configSvc.get("paintAppRole") ?? {}
   const paintQueueNames = configSvc.get("paintQueueNames") ?? {}
   const queueModule: DynamicModule = QueueingPaintModule.forRoot({
      redis,
      retention,
      jobDataSizeLimit: retention.jobDataSizeLimit,
      ...paintAppRole,
      ...paintQueueNames,
      paintEngine: {
         use: "token",
         for: "value",
         module: paintingModule,
         token: PaintingModuleTypes.IRandomArtTaskEngine,
      },
      regionMapRepo: {
         use: "token",
         for: "value",
         module: plottingModule,
         token: IpldPlottingModuleTypes.IpldRegionMapRepository,
      },
   })

   return {
      queueModule,
      paintingModule,
      plottingModule,
   }
}
