import { DynamicModule, Module } from "@nestjs/common"

import { SharedBlockstoresModule } from "../../shared/di/SharedBlockstoresModule.js"

import { AppService } from "../components/AppService.js"

@Module({})
export class AppModule {
   static registerRoot(
      plottingModule: DynamicModule,
      paintingModule: DynamicModule,
      queueModule: DynamicModule,
   ): DynamicModule {
      return {
         module: AppModule,
         imports: [
            SharedBlockstoresModule,
            plottingModule,
            paintingModule,
            queueModule,
         ],
         providers: [AppService],
         exports: [AppService, queueModule],
      }
   }
}
