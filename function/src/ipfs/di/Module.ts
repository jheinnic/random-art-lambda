import { DynamicModule, Module } from "@nestjs/common"
import {
   ConduitModuleClass,
   ConduitModuleFactory,
} from "../../di/ConduitModuleFactory.js"

import type { Blockstore } from "interface-blockstore"
import { IpfsModuleTypes } from "./Types.js"
import { ModuleConfiguration } from "./Configuration.js"
import { FsBlockstore, buildLruCache } from "../components/FsBlockstore.js"
import {
   DynamicConduitModule,
   IConduitModuleBuilder,
} from "../../di/DynamicConduitModule.js"

const ConduitBaseClass: ConduitModuleClass<[Blockstore]> =
   new ConduitModuleFactory<[Blockstore]>("IpldBlockstoreConduitModule", [
      IpfsModuleTypes.AbstractBlockstore,
   ]).build()

@Module({})
export class IpfsModule extends DynamicConduitModule {
   public static register(moduleConfig: ModuleConfiguration): DynamicModule {
      return DynamicConduitModule.registerModule(
         (builder: IConduitModuleBuilder) => {
            builder
               .identifyAs(IpfsModule)
               .addProviders(
                  {
                     provide: IpfsModuleTypes.LruCache,
                     useFactory: buildLruCache,
                     inject: [IpfsModuleTypes.FsBlockstoreConfiguration],
                  },
                  {
                     provide: IpfsModuleTypes.FsBlockstoreConfiguration,
                     useValue: moduleConfig,
                  },
                  {
                     provide: moduleConfig.injectToken,
                     useExisting: IpfsModuleTypes.AbstractBlockstore,
                  },
               )
               .addExport(moduleConfig.injectToken)
         },
      )
   }
}
