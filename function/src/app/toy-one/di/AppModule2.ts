import { Module } from "@nestjs/common"

import { IpldPlottingModule } from "../../../plotting/ipld/di/Module.js"
import { PaintingModule } from "../../../painting/artwork/di/Module.js"
import { AppService } from "../components/AppService.js"
import { AppController } from "../components/AppController.js"
import { SharedBlockstoresModule } from "../../shared/di/SharedBlockstoresModule.js"
import { SharedBlockstoresModuleTypes } from "../../shared/di/SharedBlockstoresModuleTypes.js"

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
      PaintingModule,
   ],
   providers: [AppService, AppController],
   exports: [AppService, AppController, IpldPlottingModule],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
