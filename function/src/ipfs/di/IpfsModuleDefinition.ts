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
  if (extras.injectToken !== IpfsModuleTypes.AbstractBlockstore) {
    if (module.providers === undefined) {
      module.providers = [{ provide: extras.injectToken, useExisting: IpfsModuleTypes.AbstractBlockstore }]
    } else {
      module.providers.push({ provide: extras.injectToken, useExisting: IpfsModuleTypes.AbstractBlockstore })
    }
    if (module.exports === undefined) {
      module.exports = [extras.injectToken]
    } else {
      module.exports.push(extras.injectToken)
    }
  }
  console.log(module.module)
  return module
}
