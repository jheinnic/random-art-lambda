import { DynamicModule } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { CliChannelsModuleTypes } from "../../channels/di/Types.js"
import { SharedBlockstoresModuleTypes } from "../../app/di/SharedBlockstoresModuleTypes.js"
import { PlottingModuleTypes } from "../../plotting/di/Types.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"

import { CliChannelsModule } from "../../channels/di/Module.js"
import { SharedBlockstoresModule } from "../../app/di/SharedBlockstoresModule.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { PaintingModule } from "../../painting/di/Module.js"
import { PaintingModuleTypes } from "../../painting/di/Types.js"
import { QueueingPaintModule } from "../../painting/queue/di/Module.js"
import { IpldPlottingModuleTypes } from "../../plotting/ipld/di/Types.js"
import { SeedingModule } from "../../seeding/di/Module.js"
import { SeedingModuleTypes } from "../../seeding/di/Types.js"

export const plottingModule: DynamicModule = IpldPlottingModule.registerAsync({
   imports: [SharedBlockstoresModule],
   useFactory: (blockstore: Blockstore): IpldPlottingModuleConfiguration =>
      new IpldPlottingModuleConfiguration(blockstore),
   inject: [SharedBlockstoresModuleTypes.RegionMapBlockstore],
})

export const paintingModule: DynamicModule = PaintingModule.forRoot({
   regionMapRepo: {
      use: "token",
      for: "value",
      module: plottingModule,
      token: PlottingModuleTypes.IRegionMapRepository,
   },
   taskCallChannel: {
      use: "token",
      for: "value",
      module: CliChannelsModule,
      token: CliChannelsModuleTypes.RandomArtTaskCallChannel,
   },
   taskReplyChannel: {
      use: "token",
      for: "value",
      module: CliChannelsModule,
      token: CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   },
   GMSeedExtPoint: {
      use: "token",
      for: "value",
      module: SeedingModule,
      token: SeedingModuleTypes.GMSeedExtensionPoint,
   },
})

export const queueModule: DynamicModule = QueueingPaintModule.forRoot({
   redis: {
      host: "localhost",
      port: 6379,
   },
   logRetention: {
      keepLogs: 250,
      removeOnComplete: false,
      removeOnFail: false,
   },
   jobDataSizeLimit: 1024 ^ 3,
   queueNames: {
      toFlow: "paintFlows",
      toPaint: "paintTasks",
      toStore: "paintStore",
      toReturn: "paintReturn",
   },
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
   randomArtTaskCallChannel: {
      use: "token",
      for: "value",
      module: CliChannelsModule,
      token: CliChannelsModuleTypes.RandomArtTaskCallChannel,
   },
   randomArtTaskReplyChannel: {
      use: "token",
      for: "value",
      module: CliChannelsModule,
      token: CliChannelsModuleTypes.RandomArtTaskReplyChannel,
   },
})
