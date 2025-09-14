import { Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"
import { PaintingModule } from "../../painting/di/Module.js"
import { AppService } from "../components/AppService.js"
import { AppController } from "../components/AppController.js"
import { SharedBlockstoresModule } from "./SharedBlockstoresModule.js"
import { SharedBlockstoresModuleTypes } from "./SharedBlockstoresModuleTypes.js"

@Module({
   imports: [
      SharedBlockstoresModule,
      IpldPlottingModule.registerAsync({
         imports: [SharedBlockstoresModule],
         useFactory: (
            blockstore: Blockstore,
         ): IpldPlottingModuleConfiguration =>
            new IpldPlottingModuleConfiguration(blockstore),
         inject: [SharedBlockstoresModuleTypes.RegionMapBlockstore],
      }),
      PaintingModule,
   ],
   providers: [AppService, AppController],
   exports: [
      AppService,
      AppController,
      IpldPlottingModule /*, PaintingModule */,
   ],
   // providers: [ AppService, AppServiceTwo, AppController ],
   // exports: [ AppServiceTwo, AppService, AppController, PlottingModule, PaintingModule ]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
