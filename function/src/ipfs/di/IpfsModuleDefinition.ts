import { ConfigurableModuleBuilder, DynamicModule } from "@nestjs/common"
import { BaseBlockstore } from "blockstore-core"

import { FsBlockstoreConfiguration } from "../interface/FsBlockstoreConfiguration.js"
import { ModuleInstanceConfiguration } from "../interface/ModuleInstanceConfiguration.js"
import { IpfsModuleTypes } from "./typez.js"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<FsBlockstoreConfiguration, "register", "create">({
    optionsInjectionToken: IpfsModuleTypes.FsBlockstoreConfig,
    alwaysTransient: false
  })
    .setClassMethodName("register")
    .setFactoryMethodName("create")
    .setExtras({ injectToken: IpfsModuleTypes.AbstractBlockstore }, applyExtras)
    .build()

function applyExtras (module: DynamicModule, extras: ModuleInstanceConfiguration): DynamicModule {
  return {
    ...module,
    providers: [
      ...(module.providers ?? []),
      {
        provide: extras.injectToken,
        useExisting: BaseBlockstore
      }
    ],
    exports: [
      ...(module.exports ?? []), extras.injectToken
    ]
  }
}
