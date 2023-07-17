import { ConfigurableModuleBuilder, DynamicModule } from "@nestjs/common"

import { SchemaDslConfiguration } from "./SchemaDslConfiguration.js"
import { SerdesTokenConfiguration } from "./SerdesTokenConfiguration.js"
import { FACTORY_METHOD_KEY, IpldModuleTypes, REGISTER_METHOD_KEY } from "./IpldModuleTypes.js"
import { curryRootProduction } from "../components/IpldSerdesFactory.js"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<SchemaDslConfiguration, typeof REGISTER_METHOD_KEY, typeof FACTORY_METHOD_KEY, SerdesTokenConfiguration>( {
    optionsInjectionToken: IpldModuleTypes.SchemaDslConfig, alwaysTransient: true
  } )
    .setClassMethodName( REGISTER_METHOD_KEY )
    .setFactoryMethodName( FACTORY_METHOD_KEY )
    .setExtras(
      new SerdesTokenConfiguration( {} ),
      ( module: DynamicModule, extras: SerdesTokenConfiguration ): DynamicModule => {
        if ( module.providers === undefined ) {
          module.providers = []
        }
        let rootProduction: string
        console.log( extras.rootProductionTokens )
        for ( rootProduction of Object.keys( extras.rootProductionTokens ) ) {
          console.log( rootProduction )
          console.log( extras.rootProductionTokens[ rootProduction ] )
          module.providers.push(
            {
              provide: extras.rootProductionTokens[ rootProduction ],
              useFactory: curryRootProduction( rootProduction ),
              inject: [ IpldModuleTypes.SerdesFactory ]
            }
          )
        }
        if ( module.exports === undefined ) {
          module.exports = Object.values(
            extras.rootProductionTokens
          )
        } else {
          module.exports.concat(
            Object.values(
              extras.rootProductionTokens
            )
          )
        }

        console.log( module )
        return module
      } ).build()
