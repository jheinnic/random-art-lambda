import { Module } from "@nestjs/common"

import {
   cliChannelsModule,
   plottingModule,
   paintingModule,
   cliMainModule,
} from "./Imports.js"

@Module({
   imports: [cliChannelsModule, plottingModule, paintingModule, cliMainModule],
   providers: [],
   exports: [cliMainModule],
})
export class CliAppModule {}
