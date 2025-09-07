import { IpldModuleConfiguration } from "./Configuration"
// import { IpldSchemaParser, parseSchemaDsl } from "../components/IpldSchemaParser.js"
// import { IpldSerdesFactory, curryRootProduction } from "../components/IpldSerdesFactory.js"
import {
   ConfigurableModuleBuilder,
   DynamicModule,
   Module,
} from "@nestjs/common"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import * as codec from "@ipld/dag-cbor"

import { IpldModuleExtras, SerdesConfiguration } from "./Extra.js"
import {
   IpldModuleTypes,
   FACTORY_METHOD_KEY,
   REGISTER_METHOD_KEY,
} from "./Types.js"
import { IpldSerdesFactory } from "../components/IpldSerdesFactory.js"

//  ConfigurableModuleClass,
//  MODULE_OPTIONS_TOKEN,
//  OPTIONS_TYPE,
//  ASYNC_OPTIONS_TYPE,

const dynamicHost = new ConfigurableModuleBuilder<
   IpldModuleConfiguration,
   typeof REGISTER_METHOD_KEY,
   typeof FACTORY_METHOD_KEY,
   IpldModuleExtras
>({
   moduleName: "Ipld",
   optionsInjectionToken: IpldModuleTypes.ModuleConfiguration,
   alwaysTransient: true,
})
   .setClassMethodName(REGISTER_METHOD_KEY)
   .setFactoryMethodName(FACTORY_METHOD_KEY)
   .setExtras(
      { serdes: new SerdesConfiguration("", {}, codec, hasher) },
      (
         module: DynamicModule,
         extraWrapper: IpldModuleExtras,
      ): DynamicModule => {
         const extras = extraWrapper.serdes
         if (extras.schemaDsl === "") {
            return module
         }

         if (module.providers === undefined) {
            module.providers = []
         }
         let rootProduction: string
         // console.log(extras.rootProductionTokens)
         const serdesFactory = new IpldSerdesFactory(
            extras.schemaDsl,
            extras.codec,
            extras.hasher,
         )
         for (rootProduction of Object.keys(extras.rootProductionTokens)) {
            // console.log(rootProduction)
            // console.log(extras.rootProductionTokens[rootProduction])
            module.providers.push({
               provide: extras.rootProductionTokens[rootProduction],
               useValue: serdesFactory.getProduction(rootProduction),
            })
         }
         if (module.exports === undefined) {
            module.exports = Object.values(extras.rootProductionTokens)
         } else {
            module.exports.concat(Object.values(extras.rootProductionTokens))
         }

         console.log(module)
         return module
      },
   )
   .build()

export type IpldModuleOptions = typeof dynamicHost.OPTIONS_TYPE
export type IpldModuleAsyncOptions = typeof dynamicHost.ASYNC_OPTIONS_TYPE

@Module({
   providers: [],
   exports: [],
})
export class IpldModule extends dynamicHost.ConfigurableModuleClass {
   static register(config: IpldModuleOptions): DynamicModule {
      return super.register(config)
   }

   static registerAsync(options: IpldModuleAsyncOptions): DynamicModule {
      return super.registerAsync(options)
   }
}
