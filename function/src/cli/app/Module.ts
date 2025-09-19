import { Module } from "@nestjs/common"
import { SharedBlockstoresModule } from "../../app/di/SharedBlockstoresModule.js"

import { CliChannelsModuleTypes } from "../../channels/Types.js"
import { PaintingModuleTypes } from "../../painting/di/Types.js"
import { IpldPlottingModuleTypes } from "../../plotting/ipld/di/Types.js"
import { CliChannelsModule } from "../../channels/Module.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { PaintingModule } from "../../painting/di/Module.js"
import { QueueingPaintModule } from "../../painting/queue/di/Module.js"
import { CliMainModule } from "../main/di/Module.js"

import { plottingModule, paintingModule } from "./Imports.js"

@Module({
   imports: [
      SharedBlockstoresModule,
      CliChannelsModule,
      plottingModule,
      paintingModule,
      QueueingPaintModule.forRoot({
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
      }),
      CliMainModule.forRoot({
         _i_can: true,
         paintEngine: {
            use: "token",
            for: "value",
            module: paintingModule,
            token: PaintingModuleTypes.IRandomArtTaskEngine,
         },
         // regionMapRepo: {
         //    use: "token",
         //    for: "value",
         //    module: plottingModule,
         //    token: IpldPlottingModuleTypes.IpldRegionMapRepository,
         // },
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
      }),
   ],
   providers: [],
   exports: [
      CliChannelsModule,
      IpldPlottingModule,
      PaintingModule,
      CliMainModule,
   ],
})
export class CliAppModule {}
