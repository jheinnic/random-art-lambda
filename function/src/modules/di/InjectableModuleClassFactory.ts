import { Type, DynamicModule, ForwardReference } from "@nestjs/common"

import {
   ExternalConfig,
   InjectionConfig,
   InjectableModuleClass,
   IInjectableModuleClassFactory,
   ModuleDependencies,
   ModuleDependenciesOption,
   ModuleDirectorFactory,
} from "../interface/IInjectableModuleClassFactory.js"
import {
   IDynamicModuleDirector,
   IDynamicModuleBlueprint,
} from "../interface/IDynamicModuleBuilder.js"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"

// const validPropertyNames: z.ZodString = z.string().regex(/^[a-z][a-zA-Z0-9]+$/)
type AsEntries<
   InternalConfig extends object,
   ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> = [InternalConfig, InjectionConfig<ImportTokens>]

type SomeValues<
   InternalConfig extends object,
   ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> = InternalConfig[keyof InternalConfig] | ModuleDependenciesOption

export class InjectableModuleClassFactory<
   InternalConfig extends object,
   ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> implements IInjectableModuleClassFactory<InternalConfig, ImportTokens>
{
   private built: boolean = false

   private constructor(
      private readonly importTokens: ImportTokens,
      private readonly moduleDefinition: ModuleDirectorFactory<
         InternalConfig,
         ImportTokens
      >,
      private readonly global: boolean,
   ) {}

   public static create<
      InternalConfig extends object,
      ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
   >(
      importTokens: ImportTokens,
      moduleDefinition: ModuleDirectorFactory<InternalConfig, ImportTokens>,
      global: boolean = false,
   ): InjectableModuleClassFactory<InternalConfig, ImportTokens> {
      return new InjectableModuleClassFactory(
         importTokens,
         moduleDefinition,
         global,
      )
   }

   get externalConfig(): ExternalConfig<InternalConfig, ImportTokens> {
      throw new Error("Inspect this for typeof information only")
   }

   get injectionConfig(): InjectionConfig<ImportTokens> {
      throw new Error("Inspect this for typeof information only")
   }

   get internalConfig(): InternalConfig {
      throw new Error("Inspect this for typeof information only")
   }

   build(): InjectableModuleClass<InternalConfig, ImportTokens> {
      const moduleDefinition = this.moduleDefinition
      const importTokens: ImportTokens = this.importTokens
      const global = this.global

      const InjectableModule = class AbstractInjectableModule {
         private readonly __I_LIKE_TO_COMPILE: unknown

         static forRoot(
            arg: ExternalConfig<InternalConfig, ImportTokens>,
         ): DynamicModule {
            const builder: IDynamicModuleBlueprint = new DynamicModuleBlueprint(
               this,
            )
            const sourceEntries =
               Object.entries<SomeValues<InternalConfig, ImportTokens>>(arg)
            const [internalConfig, injectConfig] = sourceEntries.reduce<
               AsEntries<InternalConfig, ImportTokens>
            >(
               (
                  acc: AsEntries<InternalConfig, ImportTokens>,
                  nextEntry: [string, SomeValues<InternalConfig, ImportTokens>],
               ): AsEntries<InternalConfig, ImportTokens> => {
                  if (nextEntry[0] in importTokens) {
                     const importObject = acc[1]
                     importObject[nextEntry[0] as keyof ImportTokens] =
                        nextEntry[1] as ModuleDependenciesOption
                  } else {
                     const internalObject = acc[0]
                     internalObject[nextEntry[0] as keyof InternalConfig] =
                        nextEntry[1] as InternalConfig[keyof InternalConfig]
                  }
                  return acc
               },
               [
                  {} as unknown as InternalConfig,
                  {} as unknown as InjectionConfig<ImportTokens>,
               ],
            )

            builder.importDependencies(
               ...Object.entries<ModuleDependenciesOption>(injectConfig).map(
                  ([tokenConfigKey, diConfig]: [
                     string,
                     ModuleDependenciesOption,
                  ]): [string | symbol | Type, ModuleDependenciesOption] => {
                     const provideToToken: string | symbol | Type =
                        importTokens[tokenConfigKey as keyof ImportTokens]
                     return [provideToToken, diConfig]
                  },
               ),
            )
            //       switch (diConfig.use) {
            //          case "token": {
            //             if (diConfig.module !== undefined) {
            //                builder.importModules(diConfig.module)
            //             }
            //             const consumeFromToken = diConfig.token
            //             switch (diConfig.for) {
            //                case "factory": {
            //                   builder.exportProviders({
            //                      provide: provideToToken,
            //                      useFactory: (x) => {
            //                         return x[diConfig.method]()
            //                      },
            //                      inject: [consumeFromToken],
            //                   })
            //                   break
            //                }
            //                case "value": {
            //                   builder.exportProviders({
            //                      provide: provideToToken,
            //                      useExisting: consumeFromToken,
            //                   })
            //                   break
            //                }
            //             }
            //             break
            //          }
            //          case "provider": {
            //             if (diConfig.module !== undefined) {
            //                builder.importModules(diConfig.module)
            //             }
            //             builder.exportProviders(diConfig.provider)
            //             switch (diConfig.for) {
            //                case "factory": {
            //                   builder.exportProviders({
            //                      provide: provideToToken,
            //                      useFactory: (x) => x[diConfig.method](),
            //                      inject: [
            //                         typeof diConfig.provider === "function"
            //                            ? diConfig.provider
            //                            : diConfig.provider.provide,
            //                      ],
            //                   })
            //                   break
            //                }
            //                case "value": {
            //                   builder.exportProviders({
            //                      provide: provideToToken,
            //                      useExisting:
            //                         typeof diConfig.provider === "function"
            //                            ? diConfig.provider
            //                            : diConfig.provider.provide,
            //                   })
            //                   break
            //                }
            //             }
            //             break
            //          }
            //          case "function": {
            //             diConfig.modules?.forEach(
            //                (
            //                   x:
            //                      | Type
            //                      | DynamicModule
            //                      | Promise<DynamicModule>
            //                      | ForwardReference,
            //                ) => {
            //                   builder.importModules(x)
            //                },
            //             )
            //             builder.exportProviders({
            //                provide: provideToToken,
            //                useFactory: diConfig.value,
            //                inject: diConfig.inject?.map((x: any): any => {
            //                   if (x.provider !== undefined) {
            //                      builder.exportProviders(x.provider)
            //                      return {
            //                         token:
            //                            typeof x.provider === "function"
            //                               ? x.provider
            //                               : x.provider.provide,
            //                         optional:
            //                            x.optional !== undefined
            //                               ? x.optional
            //                               : false,
            //                      }
            //                   } else {
            //                      return x
            //                   }
            //                }),
            //             })
            //             break
            //          }
            //          case "value": {
            //             builder.exportProviders({
            //                provide: provideToToken,
            //                useValue: diConfig.value,
            //             })
            //             break
            //          }
            //          default: {
            //             // TODO: Replace this with an exhaustiveness check!
            //             builder.exportProviders({
            //                provide: provideToToken,
            //                useValue: diConfig,
            //             })
            //          }
            //       }
            //    },
            // )

            const director: IDynamicModuleDirector = moduleDefinition(
               internalConfig,
               injectConfig,
            )
            if (director !== undefined) {
               director(builder)
            }

            if (global) {
               builder.makeGlobal()
            }
            builder.identifyAs(this)
            return builder.build()
         }
      }
      this.built = true

      return InjectableModule as InjectableModuleClass<
         InternalConfig,
         ImportTokens
      >
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
   }
}
