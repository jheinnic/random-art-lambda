import { Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { IpfsModule, IpfsModuleTypes } from "../../ipfs/di/index.js"
import { PlottingModule, PlottingModuleConfiguration, PlottingModuleConfigurationFactory } from "../../plotting/di/index.js"
import { PaintingModule } from "../../painting/di/index.js"
import { AppService } from "../components/AppService.js"
import { AppServiceTwo } from "../components/AppServiceTwo.js"
import { AppController } from "../components/AppController.js"
import { SharedBlockstoresModule } from "./SharedBlockstoresModule.js"
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"

@Module( {
  imports: [
    SharedBlockstoresModule,
    PlottingModule.registerAsync( {
      imports: [ SharedBlockstoresModule ],
      useFactory: ( blockstore: Blockstore ): PlottingModuleConfiguration =>
        new PlottingModuleConfiguration( blockstore ),
      inject: [ SharedBlockstoresModuleTypes.SharedMapBlockstore ]
    } ),
    PaintingModule
  ],
  providers: [ AppService, AppController ],
  exports: [ AppService, AppController, PlottingModule, PaintingModule ]
  // providers: [ AppService, AppServiceTwo, AppController ],
  // exports: [ AppServiceTwo, AppService, AppController, PlottingModule, PaintingModule ]
} )
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule { }
