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
// import { ProtobufPlottingModule } from "../../../plotting/protobuf/di/Module.js"
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
         // ProtobufPlottingModule,
         paintingModule,
         queueModule,
      ],
      providers: [AppService],
      exports: [
         AppService,
         queueModule,
      ],
   }
})
