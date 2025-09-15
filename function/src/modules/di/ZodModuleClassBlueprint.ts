import { Type, DynamicModule, InjectionToken } from "@nestjs/common"
import { objectKeys } from "simplytyped"
import { z } from "zod"

import { zInjectionToken, zModule, zProvider } from "../components/ZodNest.js"
import { IDynamicModuleBlueprint } from "../interface/IDynamicModuleBlueprint.js"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import {
   BaseZodModule,
   IZodModuleClassBlueprint,
} from "../interface/IZodModuleClassBlueprint.js"
import { DefaultDirector } from "../interface/IModuleBaseClassBlueprint.js"

const validPropertyNames: z.ZodString = z.string().regex(/^[a-z][a-zA-Z0-9]+$/)

export class ZodModuleClassBlueprint<
   in out MethodName extends string = "forRootImpl",
> implements
      IZodModuleClassBlueprint<MethodName, ZodModuleClassBlueprint<MethodName>>
{
   private global: boolean = false
   private built: boolean = false

   private readonly reservedNames: Set<string>
   private readonly configObject: z.ZodObject
   private readonly importsShape: any
   private readonly importTokens: Record<string, InjectionToken> = {}
   private hasImports = false

   constructor(
      readonly configObj: z.ZodObject,
      private readonly forRootImplName: MethodName,
   ) {
      this.reservedNames = new Set(objectKeys(configObj.shape))
      this.configObject = z.object({ ...configObj.shape })
   }

   requireValue<T>(
      name: string,
      token: string | symbol | Type<T>,
      schema?: z.ZodType | ((value: unknown) => boolean),
   ): ZodModuleClassBlueprint<MethodName> {
      this._verifyMutability()
      this.validateName(name)
      const trueValidator: z.ZodType = this.createTrueValidator(schema)
      this.importsShape[name] = this.createImportProperty(
         trueValidator,
         token,
         true,
      )
      this.importTokens[name] = token
      this.reservedNames.add(name)
      this.hasImports = true

      return this
   }

   requireObject<T extends object>(
      name: string,
      token: string | symbol | Type<T>,
      validator?:
         | z.ZodObject
         | z.ZodArray
         | z.ZodCustom
         | ((item: unknown) => boolean),
   ): ZodModuleClassBlueprint<MethodName> {
      this._verifyMutability()
      this.validateName(name)
      const trueValidator: z.ZodType =
         typeof token === "function"
            ? this.createTrueValidator<T>(validator, token)
            : this.createTrueValidator(validator)
      this.importsShape[name] = this.createImportProperty(trueValidator, token)
      this.importTokens[name] = token
      this.reservedNames.add(name)

      return this
   }

   makeGlobal(): ZodModuleClassBlueprint<MethodName> {
      this._verifyMutability()
      this.global = true
      return this
   }

   private validateName(name: string): void {
      const result: z.ZodSafeParseResult<string> =
         validPropertyNames.safeParse(name)
      if (!result.success) {
         throw new Error(`${name} is not a valid property name`)
      }
      if (this.reservedNames.has(name)) {
         throw new Error(`${name} is not unique`)
      }
   }

   private createTrueValidator<T extends object>(
      validator?: z.ZodType | ((value: unknown) => boolean),
      classToken?: Type<T>,
   ): z.ZodType {
      let trueValidator: z.ZodType
      if (validator === undefined) {
         if (typeof classToken === "function") {
            trueValidator = z.instanceof(classToken)
         } else {
            trueValidator = z.any()
         }
      } else if (typeof validator === "function") {
         trueValidator = z.custom(validator)
      } else {
         trueValidator = validator
      }

      return trueValidator
   }

   private createImportProperty(
      forSchema: z.ZodType,
      toToken: string | symbol | Type,
      expectValue: boolean = false,
   ): z.ZodUnion {
      return z.union([
         expectValue
            ? forSchema.pipe(
                 z.transform((value) => {
                    return { from: "literal", value }
                 }),
              )
            : zInjectionToken.transform((token: any) => {
                 return { from: "token", for: "value", token }
              }),
         z.discriminatedUnion("use", [
            z.discriminatedUnion("for", [
               z.object({
                  use: z.literal("token"),
                  for: z.literal("value"),
                  token: zInjectionToken,
                  module: zModule.optional(),
               }),
               z.object({
                  use: z.literal("token"),
                  for: z.literal("factory"),
                  token: zInjectionToken,
                  module: zModule.optional(),
                  method: z.string().default("create"),
               }),
            ]),
            z.discriminatedUnion("for", [
               z.object({
                  use: z.literal("provider"),
                  for: z.literal("value"),
                  module: zModule.optional(),
                  provider:
                     typeof toToken === "function"
                        ? zProvider.default(toToken)
                        : zProvider,
               }),
               z.object({
                  use: z.literal("provider"),
                  for: z.literal("factory"),
                  module: zModule.optional(),
                  provider: zProvider,
                  method: z.string().default("create"),
               }),
            ]),
            z.object({ use: z.literal("value"), value: forSchema }),
            z.object({
               use: z.literal("function"),
               value: z.function({
                  input: z.any().array(),
                  output: forSchema,
               }),
               inject: z
                  .array(
                     z.union([
                        zInjectionToken,
                        z.object({
                           token: zInjectionToken,
                           module: zModule.optional(),
                           optional: z.boolean().default(false),
                        }),
                        z.object({
                           provider: zProvider,
                           module: zModule.optional(),
                           optional: z.boolean().default(false),
                        }),
                     ]),
                  )
                  .optional(),
            }),
         ]),
      ])
   }

   get internalConfig(): z.ZodObject {
      return this.configObject
   }

   get externalConfig(): z.ZodObject {
      return this.configObject.extend(this.importsObject)
   }

   get importsObject(): z.ZodObject {
      return z.object(...this.importsShape)
   }

   private get internal(): z.infer<typeof this.internalConfig> {
      throw new Error("For Type Only")
   }

   private get external(): z.infer<typeof this.externalConfig> {
      throw new Error("For Type Only")
   }

   // build<External extends z.infer(typeof this.externalConfig), Internal extends z.infer(typeof this.internalConfig)>
   build<
      External extends {} = typeof this.external,
      Internal extends {} = typeof this.internal,
   >(): BaseZodModule<External, Internal, MethodName> {
      // this._verifyMutability()
      const importsObject = this.importsObject
      const internalConfigObject = this.internalConfig
      const externalConfigObject = this.externalConfig

      type ExternalConfig = typeof this.external
      type InternalConfig = typeof this.internal
      type ImportsObject = z.infer<typeof importsObject>

      const extractImports = externalConfigObject
         .pipe(
            z.transform((externalInput: ExternalConfig): ImportsObject => {
               let key
               const retVal: ImportsObject = {} as unknown as ImportsObject
               for (key of objectKeys(importsObject)) {
                  retVal[key] = externalInput[key]
               }
               return retVal
            }),
         )
         .pipe(importsObject)

      const extractConfig = externalConfigObject
         .pipe(
            z.transform((externalInput: ExternalConfig): ImportsObject => {
               let key: string
               for (key of objectKeys(importsObject)) {
                  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                  delete externalInput[key]
               }
               return externalInput
            }),
         )
         .pipe(internalConfigObject)
      const importTokens = this.importTokens
      const methodName = this.forRootImplName
      const global = this.global

      const ZodBaseDynamicModule = class ZodBaseDynamicModule {
         private readonly __I_LIKE_TO_COMPILE: unknown

         static forRoot(arg: ExternalConfig): DynamicModule {
            const builder: IDynamicModuleBlueprint = new DynamicModuleBlueprint(
               this,
            )
            const internalConfig: InternalConfig = extractConfig.safeParse(arg)
            const importsConfig: ImportsObject = extractImports.safeParse(arg)

            const director = (this as any)[methodName].call(
               this,
               internalConfig,
            )
            if (director !== undefined) {
               director(builder)
            }

            objectKeys(importTokens).forEach((tokenConfigKey: string): void => {
               const provideToToken: InjectionToken =
                  importTokens[tokenConfigKey]
               const diConfig = importsConfig[tokenConfigKey] as any
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

      return ZodBaseDynamicModule as unknown as BaseZodModule<
         External,
         Internal,
         MethodName
      >
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
   }
}
