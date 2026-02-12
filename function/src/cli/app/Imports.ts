import { DynamicModule } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { SharedBlockstoresModuleTypes } from "../../app/shared/di/SharedBlockstoresModuleTypes.js"
import { PlottingModuleTypes } from "../../plotting/di/Types.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"

import { SharedBlockstoresModule } from "../../app/shared/di/SharedBlockstoresModule.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { PaintingModule } from "../../painting/artwork/di/Module.js"
import { PaintingModuleTypes } from "../../painting/artwork/di/Types.js"
import { RandomArtProvider } from "../../painting/artwork/components/RandomArtProvider.js"
import { QueueingPaintModule } from "../../painting/queue/di/Module.js"
import { IpldPlottingModuleTypes } from "../../plotting/ipld/di/Types.js"
import {
   StagingModule,
   StagingModuleTypes,
} from "../../painting/staging/index.js"
// SHELVED: import { SeedingModule } from "../../painting/seeding/di/Module.js"
// SHELVED: import { SeedingModuleTypes } from "../../painting/seeding/di/Types.js"
// import { RxLocalChannelModule } from "../../channels/di/index.js"

export const plottingModule: DynamicModule = IpldPlottingModule.forRoot({
   blockStore: {
      use: "token",
      for: "value",
      module: SharedBlockstoresModule,
      token: SharedBlockstoresModuleTypes.RegionMapBlockstore,
   },
})

// export const paintChannelModule = RxLocalChannelModule.forRoot({
//    providerToken: PaintingModuleTypes.RandomArtTaskCallChannel,
//    channelConfig: {
//       use: "value",
//       value: {
//          concurrency: 8,
//          timeout: 60000,
//       },
//    },
// })

// SHELVED: GMSeedExtPoint config removed - seeding module in attic/
export const paintingModule: DynamicModule = PaintingModule.forRoot({
   regionMapRepo: {
      use: "token",
      for: "value",
      module: plottingModule,
      token: PlottingModuleTypes.IRegionMapRepository,
   },
   genModelProvider: {
      use: "value",
      value: new RandomArtProvider(),
   }
})

// Staging module for image output (used by stageWorker role)
// For mainApp role this is just a placeholder to satisfy the type system
export const stagingModule: DynamicModule = StagingModule.forRoot({
   stagerType: "local",
   localConfig: {
      rootPath: "/tmp/random-art-cli-output",
   },
})


// TODO: Configure the role!!!
export const queueModule: DynamicModule = QueueingPaintModule.forRoot({
   redis: {
      host: "localhost",
      port: 6379,
   },
   retention: {
      keepLogs: 250,
      removeOnComplete: {
         age: 120,
      },
      removeOnFail: {
         age: 300,
      },
   },
   jobDataSizeLimit: 1024 ^ 3,
   queueNames: {
      toPaintParts: "paintTasks",
      toGatherParts: "gatherParts",
      toGatherTasks: "gatherTasks",
      toReceiveReplies: `reply-queue-${process.env.UNIQUE_ID ?? "cli"}`,
   },
   flowProducerNames: {
      forJobSpecs: "forSpecs",
   },
   workerConcurrency: undefined, // mainApp role doesn't run workers
   roles: ["mainApp"],
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
   imageStager: {
      use: "token",
      for: "value",
      module: stagingModule,
      token: StagingModuleTypes.IImageStager,
   },
})
