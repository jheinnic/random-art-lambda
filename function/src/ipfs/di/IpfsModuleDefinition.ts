import { ConfigurableModuleBuilder, DynamicModule } from "@nestjs/common"

import { FsBlockstoreConfiguration } from "./FsBlockstoreConfiguration.js"
import { ModuleExportConfiguration } from "./ModuleExportConfiguration.js"
import { IpfsModuleTypes } from "./typez.js"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<FsBlockstoreConfiguration, "register", "create", ModuleExportConfiguration>({
    optionsInjectionToken: IpfsModuleTypes.FsBlockstoreConfig, alwaysTransient: true
  })
    .setClassMethodName("register")
    .setFactoryMethodName("create")
    .setExtras(
      new ModuleExportConfiguration(IpfsModuleTypes.AbstractBlockstore),
      (module: DynamicModule, extras: ModuleExportConfiguration): DynamicModule => {
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
        return module
      }).build()
