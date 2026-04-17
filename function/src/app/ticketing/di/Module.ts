import {
   plottingModule,
   paintingModule,
   queueModule,
} from "../../toy-two/di/Imports.js"
import {
   IDynamicModuleBuilder,
   simpleDynamicModule,
} from "../../../modules/index.js"
import { SharedBlockstoresModule } from "../../toy-one/di/index.js"
import { AppService } from "../components/TicketArtService.js"

export class TicketingAppModule extends simpleDynamicModule(
   "TicketingAppModule",
) {}

TicketingAppModule.registerModule((_builder: IDynamicModuleBuilder) => {
   return {
      module: TicketingAppModule,
      imports: [
         SharedBlockstoresModule,
         plottingModule,
         paintingModule,
         queueModule,
      ],
      providers: [AppService],
      exports: [AppService, queueModule],
   }
})
