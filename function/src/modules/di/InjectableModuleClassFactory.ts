import { Type, DynamicModule, InjectionToken } from "@nestjs/common"
import { CombineObjects, objectKeys } from "simplytyped"

import { IDynamicModuleBlueprint } from "../interface/IDynamicModuleBlueprint.js"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import {
   AbstractInjectableModule,
   ExternalConfig,
   IInjectableModuleClassFactory,
   InjectionConfig,
   ModuleDependencyOption,
} from "../interface/IInjectableModuleClassFactory.js"
import { DefaultDirector } from "../interface/IDynamicModuleBuilder.js"

// const validPropertyNames: z.ZodString = z.string().regex(/^[a-z][a-zA-Z0-9]+$/)

export class InjectableModuleClassFactory<
   in out InternalConfig extends {},
   in out ImportTokens extends Record<string, string | symbol | Type>,
   in out MethodName extends string = "forRootImpl",
> implements
      IInjectableModuleClassFactory<InternalConfig, ImportTokens, MethodName>
{
   private built: boolean = false

   readonly injectConfigShape: InjectionConfig<ImportTokens>
   readonly externalConfigShape: ExternalConfig<InternalConfig, ImportTokens>

   constructor(
      private readonly importTokens: ImportTokens,
      private readonly forRootImplName: MethodName,
      private readonly global: boolean = false,
   ) {
      this.injectConfigShape = Object.fromEntries(
         // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
         objectKeys(importTokens).map((key) => [
            key,
            {} as unknown as ModuleDependencyOption,
         ]),
      ) as InjectionConfig<ImportTokens>

      // this.importsObject = z.object(importApiShape)
      this.externalConfigShape = {} as unknown as ExternalConfig<
         InternalConfig,
         ImportTokens
      >
   }

   get externalConfigType(): typeof this.externalConfigShape {
      throw new Error("Inspect this for typeof information only")
   }

   get injectConfigType(): typeof this.injectConfigShape {
      throw new Error("Inspect this for typeof information only")
   }

   get internalConfigType(): InternalConfig {
      throw new Error("Inspect this for typeof information only")
   }

   build(): AbstractInjectableModule<InternalConfig, ImportTokens, MethodName> {
      type ExternalConfig = typeof this.externalConfigType
      // type InternalConfig = InternalConfig
      type InjectConfig = typeof this.injectConfigType

      const importKeys: Set<keyof ImportTokens> = new Set(
         objectKeys(this.importTokens),
      )

      const importTokens = this.importTokens
      const methodName = this.forRootImplName
      const global = this.global

      const AbstractInjectableModule = class AbstractInjectableModule {
         private readonly __I_LIKE_TO_COMPILE: unknown

         static forRoot(arg: ExternalConfig): DynamicModule {
            const builder: IDynamicModuleBlueprint = new DynamicModuleBlueprint(
               this,
            )
            const sourceEntries = Object.entries(arg)
            const injectConfig: InjectConfig = Object.fromEntries(
               sourceEntries.filter((entry) => {
                  if (importKeys.has(entry[0])) {
                     // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                     delete arg[entry[0]]
                     return true
                  }
                  return false
               }),
            ) as InjectionConfig<ImportTokens>
            const internalCfg: InternalConfig = arg as InternalConfig

            const director = (this as any)[methodName](internalCfg)
            if (director !== undefined) {
               director(builder)
            }

            Object.keys(injectConfig).forEach((tokenConfigKey): void => {
               const provideToToken: InjectionToken =
                  importTokens[tokenConfigKey]
               const diConfig = injectConfig[tokenConfigKey] as any
               switch (diConfig.use) {
                  case "token": {
                     if (diConfig.module !== undefined) {
                        builder.importModules(diConfig.module)
                     }
                     const consumeFromToken = diConfig.token
                     switch (diConfig.for) {
                        case "factory": {
                           builder.exportProviders({
                              provide: provideToToken,
                              useFactory: (x) => {
                                 return x[diConfig.method]()
                              },
                              inject: [consumeFromToken],
                           })
                           break
                        }
                        case "value": {
                           builder.exportProviders({
                              provide: provideToToken,
                              useExisting: consumeFromToken,
                           })
                           break
                        }
                     }
                     break
                  }
                  case "provider": {
                     if (diConfig.module !== undefined) {
                        builder.importModules(diConfig.module)
                     }
                     builder.exportProviders(diConfig.provider)
                     switch (diConfig.for) {
                        case "factory": {
                           builder.exportProviders({
                              provide: provideToToken,
                              useFactory: (x) => x[diConfig.method](),
                              inject: [
                                 typeof diConfig.provider === "function"
                                    ? diConfig.provider
                                    : diConfig.provider.provide,
                              ],
                           })
                           break
                        }
                        case "value": {
                           builder.exportProviders({
                              provide: provideToToken,
                              useExisting:
                                 typeof diConfig.provider === "function"
                                    ? diConfig.provider
                                    : diConfig.provider.provide,
                           })
                           break
                        }
                     }
                     break
                  }
                  case "function": {
                     // TODO: inject looks sus here...
                     builder.exportProviders({
                        provide: provideToToken,
                        useFactory: diConfig.value,
                        inject: diConfig.inject.map((x: any): any => {
                           if (x.provider !== undefined) {
                              builder.exportProviders(x)
                              if (x.module !== undefined) {
                                 builder.importModules(x.module)
                              }
                              return {
                                 token:
                                    typeof x.provider === "function"
                                       ? x.provider
                                       : x.provider.provide,
                                 optional:
                                    x.optional !== undefined
                                       ? x.optional
                                       : false,
                              }
                           } else if (x.token !== null) {
                              if (x.module !== undefined) {
                                 builder.importModules(x.module)
                              }
                              return x
                           } else {
                              return x
                           }
                        }),
                     })
                     break
                  }
                  case "value": {
                     builder.exportProviders({
                        provide: provideToToken,
                        useValue: diConfig.value,
                     })
                     break
                  }
               }
            })
            if (global) {
               builder.makeGlobal()
            }
            builder.identifyAs(this)
            return builder.build()
         }

         static [methodName](_arg: InternalConfig): DefaultDirector {
            throw new Error("Must implement this in concrete subclass")
         }
      }
      this.built = true

      return AbstractInjectableModule as AbstractInjectableModule<
         InternalConfig,
         ImportTokens,
         MethodName
      >
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
   }
}
