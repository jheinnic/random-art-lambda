import { Module } from "@nestjs/common"
import { SharedBlockstoresModule } from "../../app/shared/di/SharedBlockstoresModule.js"

import { PaintingModuleTypes } from "../../painting/artwork/di/Types.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { PaintingModule } from "../../painting/artwork/di/Module.js"
import { CliMainModule } from "../main/di/Module.js"

import {
   // paintChannelModule,
   plottingModule,
   paintingModule,
   queueModule,
} from "./Imports.js"
import { QueuedPaintingTypes } from "../../painting/queue/di/Types.js"

@Module({
   imports: [
      SharedBlockstoresModule,
      // paintChannelModule,
      plottingModule,
      paintingModule,
      queueModule,
      CliMainModule.forRoot({
         _i_can: true,
         paintEngine: {
            use: "token",
            for: "value",
            module: paintingModule,
            token: PaintingModuleTypes.IRandomArtTaskEngine,
         },
         queueFlowProducer: {
            use: "token",
            for: "value",
            module: queueModule,
            token: QueuedPaintingTypes.FlowProducer,
         },
         // regionMapRepo: {
         //    use: "token",
         //    for: "value",
         //    module: plottingModule,
         //    token: IpldPlottingModuleTypes.IpldRegionMapRepository,
         // },
         // taskCallChannel: {
         //    use: "token",
         //    for: "value",
         //    module: paintChannelModule,
         //    token: PaintingModuleTypes.RandomArtTaskCallChannel,
         // },
      }),
   ],
   providers: [],
   exports: [
      // paintChannelModule,
      IpldPlottingModule,
      PaintingModule,
      CliMainModule,
   ],
})
export class CliAppModule {}
