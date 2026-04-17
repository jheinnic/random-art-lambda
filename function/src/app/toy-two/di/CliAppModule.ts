import { Module } from "@nestjs/common"

import { PaintingModuleTypes } from "../../../painting/artwork/di/Types.js"
import { QueuedPaintingTypes } from "../../../painting/queue/di/Types.js"
import { PaintingModule } from "../../../painting/artwork/di/Module.js"
import { SharedBlockstoresModule } from "../../shared/di/SharedBlockstoresModule.js"
import { IpldPlottingModule } from "../../../plotting/ipld/di/Module.js"
import { CliMainModule } from "./CliMainModule.js"

import { plottingModule, paintingModule, queueModule } from "./Imports.js"

@Module({
   imports: [
      SharedBlockstoresModule,
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
      }),
   ],
   providers: [],
   exports: [IpldPlottingModule, PaintingModule, CliMainModule],
})
export class CliAppModule {}
