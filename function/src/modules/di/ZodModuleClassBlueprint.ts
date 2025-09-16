import { Type, DynamicModule, InjectionToken } from "@nestjs/common"
import { CombineObjects, objectKeys } from "simplytyped"
import * as z4 from "zod/v4/core"
import { z } from "zod"

import { zInjectionToken, zModule, zProvider } from "../components/ZodNest.js"
import { IDynamicModuleBlueprint } from "../interface/IDynamicModuleBlueprint.js"
import { DynamicModuleBlueprint } from "./DynamicModuleBlueprint.js"
import {
   BaseZodModule,
   IZodModuleClassBlueprint,
} from "../interface/IZodModuleClassBlueprint.js"
import { DefaultDirector } from "../interface/IModuleBaseClassBlueprint.js"
import { objectProperty } from "../interface/IZodModuleClassBuilder.js"

const validPropertyNames: z.ZodString = z.string().regex(/^[a-z][a-zA-Z0-9]+$/)

type NextTokens<Imports extends {}, Name extends string> = CombineObjects<
   Imports,
   Record<Name, z.infer<typeof objectProperty>>
>

export class ZodModuleClassBlueprint<
   in out ZodInternal extends {},
   in out ZodImports extends {},
   in out MethodName extends string = "forRootImpl",
> implements
      IZodModuleClassBlueprint<
         ZodInternal,
         ZodImports,
         MethodName,
         ZodModuleClassBlueprint<ZodInternal, ZodImports, MethodName>
      >
{
   private global: boolean = false
   private built: boolean = false

   private hasImports = false

   private constructor(
      readonly configObject: z.ZodObject<ZodInternal>,
      readonly importsObject: z.ZodObject<ZodImports>,
      private readonly forRootImplName: MethodName,
      private readonly reservedNames: Set<string>,
      private readonly importTokens: Record<string, InjectionToken>,
   ) {}

   static begin<
      ZodInternal extends {},
      MethodName extends string = "forRootImpl",
   >(
      configObj: z.ZodObject<ZodInternal>,
      methodName: MethodName,
   ): ZodModuleClassBlueprint<ZodInternal, {}, MethodName> {
      return new ZodModuleClassBlueprint(
         configObj,
         z.object({}),
         methodName,
         new Set(),
         {},
      )
   }

   requireValue<T, Name extends string>(
      name: Name,
      token: string | symbol | Type<T>,
      schema?: z.ZodType | ((value: unknown) => boolean),
   ): ZodModuleClassBlueprint<
      ZodInternal,
      NextTokens<ZodImports, Name>,
      MethodName
   > {
      this._verifyMutability()
      this.validateName(name)
      const trueValidator: z.ZodType = this.createTrueValidator(schema)
      this.importTokens[name] = token
      this.reservedNames.add(name)
      this.hasImports = true

      // const shape: Record<Name, typeof objectProperty> = {
      const shape = {
         [name]: objectProperty,
      }
      return new ZodModuleClassBlueprint<
         ZodInternal,
         NextTokens<ZodImports, Name>,
         MethodName
      >(
         this.configObject,
         this.importsObject.extend(z.object(shape)),
         this.forRootImplName,
         this.reservedNames,
         this.importTokens,
      )
   }

   requireObject<T extends object>(
      name: string,
      token: string | symbol | Type<T>,
      validator?:
         | z4.$ZodObject
         | z4.$ZodArray
         | z4.$ZodCustom
         | ((item: unknown) => boolean),
   ): ZodModuleClassBlueprint<ZodInternal, MethodName> {
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

   makeGlobal(): ZodModuleClassBlueprint<ZodInternal, MethodName> {
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
   ): z4.$ZodUnion {
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

   // get internalConfig(): z.infer<typeof this.configObject> {
   //    throw new Error()
   // }

   // get _external(): z.infer<typeof this.externalConfig> {
   //    throw new Error()
   // }
   // o
   // get externalConfig() {
   //    return z.object({ ...this.importsShape }).extend(this.configObject)
   // }

   // get internal(): z.infer<typeof this.internalConfig> {
   //    throw new Error("For Type Only")
   // }

   // get external(): z.infer<typeof this.externalConfig> {
   //    throw new Error("For Type Only")
   // }

   // build<External extends z.infer(typeof this.externalConfig), Internal extends z.infer(typeof this.internalConfig)>
   build(): BaseZodModule<
      CombineObjects<ZodInternal, ZodImports>,
      ZodInternal,
      MethodName
   > {
      // this._verifyMutability()
      const importsObject = this.importsObject
      const internalConfigObject = this.configObject
      const externalConfigObject = this.configObject.extend(this.importObject)

      type ExternalConfig = z.infer<typeof externalConfigObject>
      const extractImports = externalConfigObject
         .pipe(
            z.transform((externalInput: ExternalConfig): ZodImports => {
               const retVal: ZodImports = {} as unknown as ZodImports
               for (const key of objectKeys(importsObject)) {
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
