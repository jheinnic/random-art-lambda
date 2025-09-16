import { Type, DynamicModule, InjectionToken } from "@nestjs/common"
import { objectKeys, StringKeys } from "simplytyped"
import * as z4 from "zod/v4/core"
import { z } from "zod"

import { IDynamicModuleBlueprint } from "../interface/IDynamicModuleBlueprint.js"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import { BaseZodModule } from "../interface/IZodModuleClassBlueprint.js"
import { DefaultDirector } from "../interface/IModuleBaseClassBlueprint.js"
import { objectProperty } from "../interface/IZodModuleClassBuilder.js"

// const validPropertyNames: z.ZodString = z.string().regex(/^[a-z][a-zA-Z0-9]+$/)

export class InjectableModuleClassFactory<
   in out ZodInternalConfig extends z.ZodObject,
   in out ImportTokens extends Record<string, string | symbol | Type>,
   in out MethodName extends string = "forRootImpl",
> {
   private built: boolean = false

   private readonly importsObject
   private readonly externalConfig

   constructor(
      private readonly internalConfig: ZodInternalConfig,
      private readonly importTokens: ImportTokens,
      private readonly forRootImplName: MethodName,
      private readonly global: boolean = false,
   ) {
      const importApiShape = Object.fromEntries(
         objectKeys(importTokens).map((key) => [key, objectProperty]),
      ) as Record<keyof ImportTokens, typeof objectProperty>

      this.importsObject = z.object(importApiShape)
      this.externalConfig = this.internalConfig.extend(this.importsObject.shape)
   }

   get externalConfigType(): z.infer<typeof this.externalConfig> {
      throw new Error("Inspect this for typeof information only")
   }

   get internalConfigType(): z.infer<typeof this.internalConfig> {
      throw new Error("Inspect this for typeof information only")
   }

   build(): BaseZodModule<
      z.infer<typeof this.externalConfig>,
      z.infer<typeof this.internalConfig>,
      MethodName
   > {
      const importsObject = this.importsObject
      const internalConfig = this.internalConfig
      const externalConfig = this.externalConfig

      type ExternalConfig = z.infer<typeof externalConfig>
      type InternalConfig = z.infer<typeof internalConfig>
      type ImportsObject = z.infer<typeof importsObject>

      const internalKeys: Set<string> = new Set(
         objectKeys(internalConfig.shape),
      ) as unknown as Set<StringKeys<InternalConfig>>
      const importKeys: Set<string> = new Set(
         objectKeys(importsObject.shape),
      ) as unknown as Set<StringKeys<ImportsObject>>

      const importTokens = this.importTokens
      const methodName = this.forRootImplName
      const global = this.global

      const ZodBaseDynamicModule = class ZodBaseDynamicModule {
         private readonly __I_LIKE_TO_COMPILE: unknown

         static forRoot(arg: ExternalConfig): DynamicModule {
            const builder: IDynamicModuleBlueprint = new DynamicModuleBlueprint(
               this,
            )
            const config: InternalConfig = Object.fromEntries(
               [...internalKeys].map((key) => [
                  key,
                  arg[key as keyof ExternalConfig],
               ]),
            ) as InternalConfig
            const internalCfg: InternalConfig = internalConfig.parse(config)

            const director = (this as any)[methodName](internalCfg)
            if (director !== undefined) {
               director(builder)
            }

            const imports: ImportsObject = Object.fromEntries(
               [...importKeys].map((key) => [
                  key,
                  arg[key as keyof ExternalConfig],
               ]),
            ) as ImportsObject
            const importsCfg: ImportsObject = importsObject.parse(imports)
            objectKeys(importsCfg).forEach((tokenConfigKey): void => {
               const provideToToken: InjectionToken =
                  importTokens[tokenConfigKey]
               const diConfig = importsCfg[tokenConfigKey] as any
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

      return ZodBaseDynamicModule as BaseZodModule<
         ExternalConfig,
         InternalConfig,
         MethodName
      >
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
   }
}
