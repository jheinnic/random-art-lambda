import {
   Type,
   DynamicModule,
   ForwardReference,
   Provider,
   Abstract,
} from "@nestjs/common"
import { IConduitModuleBuilder } from "../interface/IConduitModuleBuilder.js"

export class DynamicModuleBuilder implements IConduitModuleBuilder {
   private global: boolean = false

   private built: boolean = false

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

   constructor(private module: Type<any>) {}

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

   private _verifyMutability(): void {
      if (this.built) {
         throw new Error("This unit has already been built.")
      }
   }
}
