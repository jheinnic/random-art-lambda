import {
   ConfigurableModuleBuilder,
   DynamicModule,
   Module,
} from "@nestjs/common"
import { Chan, chan } from "medium"

import { CoroutineModuleTypes } from "./Types.js"
import { CoroutineModuleExtras } from "./Extras.js"
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
         console.log("Input is ", moduleIn)
         // console.log("Coroutines transform requested with :: ", extras)
         if (keys.length === 0) {
            return moduleIn
         }
         moduleIn.imports = moduleIn.imports ?? []
         moduleIn.exports = moduleIn.exports ?? []
         const providers = moduleIn.providers ?? []
         const imports = moduleIn.imports
         const exports = moduleIn.exports

         keys.forEach((key: symbol | string) => {
            // console.log("Handling an extra, ", key)
            const value = extras.requests[key]
            switch (value.component) {
               case "BlockingChannel": {
                  const provider = {
                     provide: key,
                     useFactory: (..._args: any[]): Chan =>
                        chan(value.concurrency ?? 1),
                  }
                  providers.push(provider)
                  exports.push(provider)
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
         })

         console.log("Transformed Coroutines Module is now :: ", moduleIn)
         return moduleIn
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
export class CoroutinesModule extends dynamicHost.ConfigurableModuleClass {}
