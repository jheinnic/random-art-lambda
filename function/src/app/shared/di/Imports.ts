import {
   // PaintAppRolesEnvironment,
   // PaintQueueNamesEnvironment,
   PaintQueueRedisEnvironment,
   // PaintQueueRetentionEnvironment,
} from "./Loaders"
import { DynamicModule } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"
import { PaintingModuleTypes } from "../../../painting/artwork/di/Types.js"
import { RandomArtProvider } from "../../../painting/artwork/components/RandomArtProvider.js"
// SHELVED: import { SeedingModuleTypes } from "../../../painting/seeding/di/Types.js"
import { PlottingModuleTypes } from "../../../plotting/di/Types.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"
// import { RANDOM_ART_LOCAL_CALLS_CHANNEL } from "../../di/Types._st"

// import { RxLocalChannelModule } from "../../../channels/di/Module.js"
import { PaintingModule } from "../../../painting/artwork/di/Module.js"
import { QueueingPaintModule } from "../../../painting/queue/di/Module.js"
// SHELVED: import { SeedingModule } from "../../../painting/seeding/di/Module.js"
import { SharedBlockstoresModule } from "./SharedBlockstoresModule.js"
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

   // const paintChannelModule: DynamicModule = RxLocalChannelModule.forRoot({
   //    providerToken: RANDOM_ART_LOCAL_CALLS_CHANNEL, // PaintingModuleTypes.RandomArtTaskCallChannel,
   //    channelConfig: {
   //       use: "value",
   //       value: painterChannel,
   //    },
   // })

   // SHELVED: GMSeedExtPoint config removed - seeding module in attic/
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
      // taskCallChannel: {
      //    use: "token",
      //    for: "value",
      //    module: paintChannelModule,
      //    token: RANDOM_ART_LOCAL_CALLS_CHANNEL, // PaintingModuleTypes.RandomArtTaskCallChannel,
      // },
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
      // randomArtTaskCallChannel: {
      //    use: "token",
      //    for: "value",
      //    module: paintChannelModule,
      //    token: RANDOM_ART_LOCAL_CALLS_CHANNEL, // PaintingModuleTypes.RandomArtTaskCallChannel,
      // },
   })

   return {
      queueModule,
      paintingModule,
      // paintChannelModule,
      plottingModule,
   }
}
