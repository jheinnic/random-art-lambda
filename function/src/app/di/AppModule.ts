import { DynamicModule, Module } from "@nestjs/common"

// import { RxLocalChannelModule } from "../../channels/di/Module.js"
import { SharedBlockstoresModule } from "../shared/di/SharedBlockstoresModule.js"
// SHELVED: Seeding modules moved to attic/
// import { ProtobufPlottingModule } from "../../plotting/protobuf/di/Module.js"
// import { SeedingModule } from "../../painting/seeding/di/Module.js"
// import { BuiltInGenModelSeedingModule } from "../../painting/seeding/builtin/di/Module.js"

import { AppService } from "../components/AppService.js"

@Module({})
export class AppModule {
   static registerRoot(
      plottingModule: DynamicModule,
      // paintChannelModule: DynamicModule,
      paintingModule: DynamicModule,
      queueModule: DynamicModule,
   ): DynamicModule {
      return {
         module: AppModule,
         imports: [
            SharedBlockstoresModule,
            plottingModule,
            // paintChannelModule,
            paintingModule,
            queueModule,
            // SHELVED: SeedingModule, BuiltInGenModelSeedingModule
            // ProtobufPlottingModule,
         ],
         providers: [AppService],
         exports: [
            AppService,
            // RxLocalChannelModule,
            // IpldPlottingModule,
            // paintChannelModule,
            // paintingModule,
            queueModule,
         ],
      }
   }
}
