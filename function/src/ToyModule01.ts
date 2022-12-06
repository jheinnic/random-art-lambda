import { Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore/src/index.js"

import { SharedBlockstoresModule, SharedBlockstoresModuleTypes } from "./app/di/index.js"
import { CompModule } from "./ToyCompModule01.js"
import { GCHashFactory } from "./ToyComps01.js"

Module({
  imports: [
    SharedBlockstoresModule,
    CompModule.registerAsync( {
      imports: [SharedBlockstoresModule],
      useFactory: ( artBlocks: Blockstore, taskBlocks: Blockstore ) => {
        return { artBlocks, taskBlocks }
      },
      inject: [SharedBlockstoresModuleTypes.SharedArtBlockstore, SharedBlockstoresModuleTypes.SharedTaskBlockstore]
    }) ],
  providers: [],
  exports: [CompModule]
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}