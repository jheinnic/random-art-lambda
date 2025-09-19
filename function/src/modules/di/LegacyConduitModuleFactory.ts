import {
   DynamicModule,
   ConfigurableModuleBuilder,
   ConfigurableModuleHost,
   Provider,
   InjectionToken,
} from "@nestjs/common"

// A generic type that maps a tuple of types to a configuration object
// The keys are automatically generated from the tuple's indices.
type ConduitConfig<T extends unknown[]> = {
   [K in keyof T]: T[K] extends infer I ? I : never
}

type ConduitProviders<T extends unknown[]> = {
   [K in keyof T]: T[K] extends infer I ? Provider<I> : never
}

type ConduitTokens<T extends unknown[]> = {
   [K in keyof T]: InjectionToken
}

type ProvidedBy<T extends Provider<unknown>> =
   T extends Provider<infer I> ? I : never

export type ConduitModuleClass<T extends unknown[]> = (new () => any) &
   Record<
      "forProviders",
      (
         providers: ConduitProviders<T>,
         additionalProviders?: Array<Provider<unknown>>,
      ) => DynamicModule
   >

export class LegacyConduitModuleFactory<T extends unknown[]> {
   private readonly host: ConfigurableModuleHost<
      ConduitConfig<T>,
      "register",
      "create"
   >

   constructor(
      private readonly moduleName: string,
      private readonly tokens: ConduitTokens<T>,
   ) {
      // Use a generic host to create the module
      this.host = new ConfigurableModuleBuilder<ConduitConfig<T>>({
         moduleName: this.moduleName,
         alwaysTransient: false,
      }).build()
   }

   public build(): ConduitModuleClass<T> {
      const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = this.host
      const tokens: ConduitTokens<T> = this.tokens

      // Custom implementation for `registerAsync` that handles provider injection
      const ConduitDynamicModule: ConduitModuleClass<T> = class ConduitDynamicModule extends ConfigurableModuleClass {
         public static forProviders(
            providers: ConduitProviders<T>,
            additionalProviders: Array<Provider<unknown>> = [],
         ): DynamicModule {
            const dynamicModule = ConfigurableModuleClass.registerAsync({
               useFactory: (...args: any[]): ConduitConfig<T> => {
                  return args as ConduitConfig<T>
               },
               inject: providers.map((x: Provider<unknown>): InjectionToken => {
                  if (typeof x === "function") {
                     return x
                  }
                  return x.provide
               }),
               provideInjectionTokensFrom: providers,
            })

            dynamicModule.providers = [
               ...(dynamicModule.providers === undefined
                  ? []
                  : dynamicModule.providers),
               ...additionalProviders,
               ...providers.map(
                  (x: Provider<unknown>, index: number): typeof x => {
                     return {
                        provide: tokens[index],
                        useFactory: (
                           config: ConduitConfig<T>,
                        ): ProvidedBy<typeof x> => {
                           return config[index]
                        },
                        inject: [MODULE_OPTIONS_TOKEN],
                     }
                  },
               ),
            ]
            dynamicModule.exports = [
               ...(dynamicModule.exports === undefined
                  ? []
                  : dynamicModule.exports),
               ...tokens,
            ]

            return dynamicModule
         }
      }

      return ConduitDynamicModule
   }
}
