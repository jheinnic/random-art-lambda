import {
   Type,
   DynamicModule,
   ForwardReference,
   Provider,
   Abstract,
   InjectionToken,
} from "@nestjs/common"
import { z } from "zod"
import { UnionizeTuple, objectKeys } from "simplytyped"

import { IConduitModuleBuilder } from "../interface/IConduitModuleBuilder.js"
import { zInjectionToken, zModule, zProvider } from "../components/ZodNest.js"

const ShapeNames = ["exports", "imports", "config"] as const
type ShapeName = UnionizeTuple<typeof ShapeNames>

interface Layer {
   readonly exportsShape: any
   readonly exportTokens: Record<string, InjectionToken>
   readonly importsShape: any
   readonly importTokens: Record<string, InjectionToken>
   readonly configShape: any
   readonly sectionNesting: Partial<Record<ShapeName, string>>
   readonly rootNamesTaken: Set<string>
}
interface RootLayer extends Layer {
   nestedLayers: Record<string, Layer>
}

const validPropertyNames: z.ZodString = z.string().regex(/^[a-z][a-zA-Z0-9]+$/)

export class ConduitModuleBuilder implements IConduitModuleBuilder {
   private global: boolean = false
   private built: boolean = false

   private readonly rootLayer: RootLayer

   private hasImports = false

   // private hasExports: boolean = false

   // private readonly multiExportsObjects: Array<any> = []

   private readonly imports: Array<
      Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
   > = []

   private readonly providers: Array<Type<any> | Provider<unknown>> = []

   private readonly exports: Array<
      | DynamicModule
      | string
      | symbol
      | Provider
      | ForwardReference
      | Abstract<any>
      | Function
   > = []

   constructor(
      private module: Type<any>,
      private readonly nestingNames: Partial<Record<ShapeName, string>>,
   ) {
      const sectionNesting: Partial<Record<ShapeName, string>> = {}
      objectKeys(nestingNames).forEach((x: ShapeName) => {
         const nextName: string | undefined = nestingNames[x]
         sectionNesting[x] = nextName === undefined ? x : nextName
      })
      this.rootLayer = {
         configShape: {},
         exportsShape: {},
         exportTokens: {},
         importsShape: {},
         importTokens: {},
         nestedLayers: {},
         sectionNesting,
         rootNamesTaken: new Set(...Object.values(sectionNesting)),
      }
   }

   identifyAs(module: Type<any>): IConduitModuleBuilder {
      this._verifyMutability()
      this.module = module
      return this
   }

   importModules(
      ...modules: Array<
         Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
      >
   ): IConduitModuleBuilder {
      this._verifyMutability()
      this.imports.unshift(...modules)
      return this
   }

   exportModules(
      ...modules: Array<Type<any> | DynamicModule | ForwardReference>
   ): IConduitModuleBuilder {
      this._verifyMutability()
      this.imports.unshift(...modules)
      this.exports.unshift(...modules)
      return this
   }

   requireValue<T>(
      name: string,
      token: string | symbol | Type<T>,
      schema?: z.ZodType | ((value: unknown) => boolean),
   ): ConduitModuleBuilder {
      this._verifyMutability()
      this.validateName(name, "imports")
      const trueValidator: z.ZodType = this.createTrueValidator(schema)
      this.rootLayer.importsShape[name] = this.createImportProperty(
         trueValidator,
         token,
         true,
      )
      this.rootLayer.importTokens[name] = token
      if (!("imports" in this.rootLayer.sectionNesting)) {
         this.rootLayer.rootNamesTaken.add(name)
      }
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
   ): ConduitModuleBuilder {
      this._verifyMutability()
      this.validateName(name, "imports")
      const trueValidator: z.ZodType =
         typeof token === "function"
            ? this.createTrueValidator<T>(validator, token)
            : this.createTrueValidator(validator)
      this.rootLayer.importsShape[name] = this.createImportProperty(
         trueValidator,
         token,
      )
      this.rootLayer.importTokens[name] = token
      if (!("imports" in this.rootLayer.sectionNesting)) {
         this.rootLayer.rootNamesTaken.add(name)
      }

      return this
   }

   offerNamedExport(
      name: string,
      optional: boolean = false,
   ): ConduitModuleBuilder {
      this._verifyMutability()
      const exportsShape = this.validateName(name, "exports")
      const property = zInjectionToken
      if (optional) {
         exportsShape[name] = property.optional()
      } else {
         exportsShape[name] = property
      }
      return this
   }

   private validateName(name: string, layer: Layer, purpose: ShapeName): void {
      const result: z.ZodSafeParseResult<string> =
         validPropertyNames.safeParse(name)
      if (!result.success) {
         throw new Error(`${name} is not a valid property name`)
      }

      const nestingName = layer.sectionNesting[purpose]
      if (nestingName === undefined) {
         if (name in layer.rootNamesTaken) {
            throw new Error(`${name} is not unique`)
         }
      } else {
         let shape: any
         switch (purpose) {
            case "imports": {
               shape = layer.importsShape
               break
            }
            case "exports": {
               shape = layer.exportsShape
               break
            }
            case "config": {
               shape = layer.configShape
               break
            }
         }
         if (name in shape) {
            throw new Error(name + " is not unique in " + purpose)
         }
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
                  provider:
                     typeof toToken === "function"
                        ? zProvider.default(toToken)
                        : zProvider,
               }),
               z.object({
                  use: z.literal("provider"),
                  for: z.literal("factory"),
                  provider: zProvider,
                  method: z.string().default("create"),
                  inject: this.createInjectConfigArray(),
               }),
            ]),
            z.object({ use: z.literal("value"), value: forSchema }),
            z.object({
               use: z.literal("function"),
               inject: this.createInjectConfigArray(),
            }),
         ]),
      ])
   }

   private createInjectConfigArray(): z.ZodOptional {
      return z
         .array(
            z.union([
               zInjectionToken,
               zProvider,
               z.object({
                  token: zInjectionToken,
                  module: zModule.optional(),
                  optional: z.boolean().default(false),
               }),
            ]),
         )
         .optional()
   }

   defineProviders(
      ...providers: Array<Type<any> | Provider<unknown>>
   ): IConduitModuleBuilder {
      this._verifyMutability()
      this.providers.unshift(...providers)
      return this
   }

   exportProviders(
      ...providers: Array<Type<any> | Provider<unknown>>
   ): IConduitModuleBuilder {
      this._verifyMutability()
      this.providers.unshift(...providers)
      this.exports.unshift(...providers)
      return this
   }

   makeGlobal(): IConduitModuleBuilder {
      this._verifyMutability()
      this.global = true
      return this
   }

   build(): DynamicModule {
      this._verifyMutability()
      this.built = true
      return {
         module: this.module,
         imports: this.imports,
         providers: this.providers,
         exports: this.exports,
         global: this.global,
      }
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
   }
}
