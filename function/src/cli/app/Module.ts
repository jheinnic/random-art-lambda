import { Module } from "@nestjs/common"
import { SharedBlockstoresModule } from "../../app/di/SharedBlockstoresModule.js"

import { PaintingModule } from "../../painting/di/Module.js"
import { QueuedPaintingModule } from "../../painting/queue/di/Module.js"
import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { CliChannelsModule } from "../../channels/Module.js"
import { CliMainModule } from "../main/di/Module.js"
import {
   plottingModule,
   paintingModule,
   cliMainModuleAsyncOptions,
} from "./Imports.js"

@Module({
   imports: [
      SharedBlockstoresModule,
      CliChannelsModule,
      plottingModule,
      paintingModule,
      CliMainModule.registerAsync(cliMainModuleAsyncOptions),
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
