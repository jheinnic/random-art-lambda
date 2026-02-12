import { DynamicModule, Module } from "@nestjs/common"
import { ServiceModuleTypes } from "./ServiceModuleTypes.js"
import { Service } from "./Service.js"
import { SatisfiableDependency } from "../SatisfiableDependency.js"

@Module({})
export class ServiceModule {
   static forRoot(): DynamicModule {
      let retval: DynamicModule = {
         module: ServiceModule,
         imports: [],
         providers: [
            {
               provide: ServiceModuleTypes.Service,
               useClass: Service,
            },
         ],
         exports: [],
      }

      retval = SatisfiableDependency.extendDynamicModule(
         retval,
         ServiceModuleTypes.RepoProducer,
         ServiceModuleTypes.RepoConsumer,
      )

      return retval
   }
}
