import { ConfigurableModuleBuilder, DynamicModule } from "@nestjs/common"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import * as codec from "@ipld/dag-cbor"

import { SerdesConfiguration } from "./SerdesConfiguration.js"
import { FACTORY_METHOD_KEY, IpldModuleTypes, REGISTER_METHOD_KEY } from "./IpldModuleTypes.js"
import { IpldSerdesFactory } from "../components/IpldSerdesFactory.js"

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<{}, typeof REGISTER_METHOD_KEY, typeof FACTORY_METHOD_KEY, SerdesConfiguration>( {
    alwaysTransient: true
  } )
    .setClassMethodName( REGISTER_METHOD_KEY )
    .setFactoryMethodName( FACTORY_METHOD_KEY )
    .setExtras(
      new SerdesConfiguration( '', {}, 113, codec, 18, hasher ),
      ( module: DynamicModule, extras: SerdesConfiguration ): DynamicModule => {
        if ( extras.schemaDsl === '' ) {
          return module;
        }

        if ( module.providers === undefined ) {
          module.providers = []
        }
        let rootProduction: string
        console.log( extras.rootProductionTokens )
        const serdesFactory = new IpldSerdesFactory( extras.schemaDsl, extras.codec, extras.hasher );
        for ( rootProduction of Object.keys( extras.rootProductionTokens ) ) {
          console.log( rootProduction )
          console.log( extras.rootProductionTokens[rootProduction] )
          module.providers.push(
            {
              provide: extras.rootProductionTokens[rootProduction],
              useExisting: serdesFactory.getProduction(rootProduction)
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
