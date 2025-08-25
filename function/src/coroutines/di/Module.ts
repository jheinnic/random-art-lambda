import {
   InjectionToken,
   ConfigurableModuleBuilder,
   DynamicModule,
   Module,
} from "@nestjs/common"
import { chan } from "medium"

import { CoroutineModuleTypes } from "./Types.js"
import { CoroutineModuleExtras, ProviderRequest } from "./Extras.js"
import { REGISTER_METHOD_KEY, CREATE_METHOD_KEY } from "./Constants.js"

const dynamicHost = new ConfigurableModuleBuilder<
   {},
   typeof REGISTER_METHOD_KEY,
   typeof CREATE_METHOD_KEY,
   CoroutineModuleExtras
>({
   moduleName: "CoroutinesModule",
   optionsInjectionToken: CoroutineModuleTypes.ModuleConfiguration,
   alwaysTransient: false,
})
   .setClassMethodName(REGISTER_METHOD_KEY)
   .setFactoryMethodName(CREATE_METHOD_KEY)
   .setExtras(
      { requests: {} },
      (
         moduleIn: DynamicModule,
         extras: CoroutineModuleExtras,
      ): DynamicModule => {
         const keys = [
            ...Object.getOwnPropertySymbols(extras.requests),
            ...Object.getOwnPropertyNames(extras.requests),
         ]
         // console.log("Coroutines transform requested with :: ", extras)
         if (keys.length === 0) {
            return moduleIn
         }
         const providers = moduleIn.providers ?? []
         const exports = moduleIn.exports ?? []
         const imports = moduleIn.imports ?? []

         keys.forEach((key: symbol | string) => {
            // console.log("Handling an extra, ", key)
            const value = extras.requests[key]
            let component
            switch (value.component) {
               case "BlockingChannel": {
                  component = chan(value.concurrency ?? 1)
                  break
               }
               case "DroppingChannel": {
                  // Handle NonBlockingChannel
                  break
               }
               case "SlidingChannel": {
                  // Handle NonBlockingCallReply
                  break
               }
               default: {
                  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                  throw new Error(`Unknown component: ${value}`)
               }
            }
            providers.push({
               provide: key,
               useValue: component,
            })
            exports.push(key)
         })

         const moduleOut: DynamicModule = {
            imports,
            providers,
            exports,
            module: moduleIn.module,
         }
         console.log("Transformed Coroutines Module is now :: ", moduleOut)
         return moduleOut
      },
   )
   .build()

export type CoroutinesModuleAsyncOptions = typeof dynamicHost.ASYNC_OPTIONS_TYPE
export type CoroutinesModuleOptions = typeof dynamicHost.OPTIONS_TYPE

@Module({
   imports: [],
   providers: [],
   exports: [],
})
export class CoroutinesModule extends dynamicHost.ConfigurableModuleClass {
   static register(config: CoroutinesModuleAsyncOptions): DynamicModule {
      // console.log(
      //    "In CoroutinesMode.elevate() and watch him for a few more days :: ",
      //    config,
      // )
      const rv = super.register(config)
      // console.log("now the contract is : ", rv)
      return rv
   }

   // static registerAsync(options: CoroutinesModuleAsyncOptions): DynamicModule {
   // return super.registerAsync(options)
   // }
}
