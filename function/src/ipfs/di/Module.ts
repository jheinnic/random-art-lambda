import { DynamicModule, Module } from "@nestjs/common"

// import type { Blockstore } from "interface-blockstore"
import { IpfsModuleTypes } from "./Types.js"
import { ModuleConfiguration } from "./Configuration.js"
import { FsBlockstore, buildLruCache } from "../components/FsBlockstore.js"
import {
   DynamicConduitModule,
   IConduitModuleBuilder,
} from "../../modules/index.js"

// const ConduitBaseClass: ConduitModuleClass<[Blockstore]> =
//    new ConduitModuleFactory<[Blockstore]>("IpldBlockstoreConduitModule", [
//       IpfsModuleTypes.AbstractBlockstore,
//    ]).build()

@Module({})
export class IpfsModule extends DynamicConduitModule {
   public static register(moduleConfig: ModuleConfiguration): DynamicModule {
      return DynamicConduitModule.registerModule(
         (builder: IConduitModuleBuilder) => {
            builder
               .defineProviders(
                  {
                     provide: IpfsModuleTypes.LruCache,
                     useFactory: buildLruCache,
                     inject: [IpfsModuleTypes.FsBlockstoreConfiguration],
                  },
                  {
                     provide: IpfsModuleTypes.FsBlockstoreConfiguration,
                     useValue: moduleConfig,
                  },
               )
               .exportProviders({
                  provide: moduleConfig.injectToken,
                  useClass: FsBlockstore,
               })
         },
      )
   }
}
