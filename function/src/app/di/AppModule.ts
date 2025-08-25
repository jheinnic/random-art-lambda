import { Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import {
   IpldPlottingModule,
   IpldPlottingModuleConfiguration,
} from "../../plotting/ipld/index.js"
// import { PaintingModule } from "../../painting/di/Module.js"
import { AppService } from "../components/AppService.js"
import { AppServiceTwo } from "../components/AppServiceTwo.js"
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
         inject: [SharedBlockstoresModuleTypes.SharedMapBlockstore],
      }),
      // PaintingModule,
   ],
   providers: [AppService, AppServiceTwo],
   exports: [
      AppServiceTwo,
      AppService,
      IpldPlottingModule /* , PaintingModule */,
   ],
})
export class AppModule {}
