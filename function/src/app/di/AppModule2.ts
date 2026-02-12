import { Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"

import { IpldPlottingModule } from "../../plotting/ipld/di/Module.js"
import { IpldPlottingModuleConfiguration } from "../../plotting/ipld/di/Configuration.js"
import { PaintingModule } from "../../painting/artwork/di/Module.js"
import { AppService } from "../components/AppService.js"
import { AppController } from "../components/AppController.js"
import { SharedBlockstoresModule } from "../shared/di/SharedBlockstoresModule.js"
import { SharedBlockstoresModuleTypes } from "../shared/di/SharedBlockstoresModuleTypes.js"
// import { RxLocalChannelModule } from "../../cli/index.js"
import { PaintingModuleTypes } from "../../painting/artwork/di/Types.js"

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

@Module({
   imports: [
      SharedBlockstoresModule,
      IpldPlottingModule.forRoot({
         blockStore: {
            use: "token",
            for: "value",
            module: SharedBlockstoresModule,
            token: SharedBlockstoresModuleTypes.RegionMapBlockstore,
         },
      }),
      // paintChannelModule,
      PaintingModule,
   ],
   providers: [AppService, AppController],
   exports: [
      AppService,
      AppController,
      IpldPlottingModule,
      // paintChannelModule /*, PaintingModule */,
   ],
   // providers: [ AppService, AppServiceTwo, AppController ],
   // exports: [ AppServiceTwo, AppService, AppController, PlottingModule, PaintingModule ]
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
