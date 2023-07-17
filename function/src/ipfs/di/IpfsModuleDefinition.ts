import { ConfigurableModuleBuilder, DynamicModule } from "@nestjs/common"

import { FsBlockstoreConfiguration } from "./FsBlockstoreConfiguration.js"
import { FACTORY_METHOD_KEY, IpfsModuleTypes, REGISTER_METHOD_KEY } from "./IpfsModuleTypes.js"
import { ModuleExportConfiguration } from "./ModuleExportConfiguration.js"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<FsBlockstoreConfiguration, typeof REGISTER_METHOD_KEY, typeof FACTORY_METHOD_KEY, ModuleExportConfiguration>( {
    optionsInjectionToken: IpfsModuleTypes.FsBlockstoreConfiguration, alwaysTransient: true,
  } )
    .setClassMethodName( REGISTER_METHOD_KEY )
    .setFactoryMethodName( FACTORY_METHOD_KEY )
    .setExtras(
      new ModuleExportConfiguration( IpfsModuleTypes.AbstractBlockstore ),
      ( module: DynamicModule, extras: ModuleExportConfiguration ): DynamicModule => {
        if ( extras.injectToken !== IpfsModuleTypes.AbstractBlockstore ) {
          if ( module.providers === undefined ) {
            module.providers = [ { provide: extras.injectToken, useExisting: IpfsModuleTypes.AbstractBlockstore } ]
          } else {
            module.providers.push( { provide: extras.injectToken, useExisting: IpfsModuleTypes.AbstractBlockstore } )
          }
          if ( module.exports === undefined ) {
            module.exports = [ extras.injectToken ]
          } else {
            module.exports.push( extras.injectToken )
          }
        }
        return module
      } ).build()
