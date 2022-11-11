import { DynamicModule, Module } from "@nestjs/common"

import { buildLruCache, FsBlockstore } from "../components/FsBlockstore.js"
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } from "./IpfsModuleDefinition.js"
import { IpfsModuleTypes } from "./IpfsModuleTypes.js"

@Module({
  providers: [
  {
  provide: IpfsModuleTypes.LruCache,
  useFactory: buildLruCache,
  inject: [IpfsModuleTypes.FsBlockstoreConfiguration]
  },
  { provide: IpfsModuleTypes.AbstractBlockstore, useClass: FsBlockstore }
  ],
  exports: [IpfsModuleTypes.AbstractBlockstore]
  })
export class IpfsModule extends ConfigurableModuleClass {
  // static module = initializer(IpfsModule)

  static register (config: typeof OPTIONS_TYPE): DynamicModule {
    return super.register(config)
  }

  static registerAsync (options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return super.registerAsync(options)
  }
}
