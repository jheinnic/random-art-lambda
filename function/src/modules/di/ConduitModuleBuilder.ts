import {
   Type,
   DynamicModule,
   ForwardReference,
   Provider,
   Abstract,
} from "@nestjs/common"
import { IConduitModuleBuilder } from "../interface/IConduitModuleBuilder.js"

export class ConduitModuleBuilder implements IConduitModuleBuilder {
   private global: boolean = false
   private built: boolean = false
   private frozen: boolean = false

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
      readonly staticPrecursor?: ConduitModuleBuilder,
   ) {
      if (staticPrecursor !== undefined) {
         if (staticPrecursor.built || !staticPrecursor.frozen) {
            throw new Error("Precursor has not been frozen for reuse")
         }
         this.global = staticPrecursor.global
         this.imports = [...staticPrecursor.imports]
         this.providers = [...staticPrecursor.providers]
         this.exports = [...staticPrecursor.exports]
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

   freeze(): void {
      if (this.built) {
         throw new Error(
            "Cannot freeze this for use as a precursor because it was already used for build()",
         )
      }
      this.frozen = true
   }

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
      if (this.frozen) {
         throw new Error(
            "This unit has been frozen for use as a fixed precursor.",
         )
      }
   }
}
