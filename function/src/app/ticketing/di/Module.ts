import {
   plottingModule,
   paintingModule,
   queueModule,
} from "../../../cli/app/Imports.js"
// import { RxLocalChannelModule } from "../../../cli/index.js"
import {
   IDynamicModuleBlueprint,
   IDynamicModuleBuilder,
   simpleDynamicModule,
} from "../../../modules/index.js"
// SHELVED: import { BuiltInGenModelSeedingModule } from "../../../painting/seeding/builtin/di/Module.js"
// SHELVED: import { SeedingModule } from "../../../painting/seeding/di/Module.js"
import { ProtobufPlottingModule } from "../../../plotting/protobuf/di/Module.js"
// import { paintChannelModule } from "../../di/AppModule2.js"
import { SharedBlockstoresModule } from "../../di/index.js"
import { AppService } from "../components/TicketArtService.js"

export class TicketingAppModule extends simpleDynamicModule(
   "TickettingAppModule",
) {}

TicketingAppModule.registerModule((builder: IDynamicModuleBuilder) => {
   return {
      module: TicketingAppModule,
      imports: [
         SharedBlockstoresModule,
         plottingModule,
         ProtobufPlottingModule,
         // paintChannelModule,
         paintingModule,
         queueModule,
         // SHELVED: SeedingModule, BuiltInGenModelSeedingModule
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
})
