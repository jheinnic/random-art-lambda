import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common"
import { Director } from "./Utility.js"
import { ModuleDependenciesOption } from "./IInjectableModuleClassFactory.js"

export interface IBaseDynamicModuleBuilder<
   B extends IBaseDynamicModuleBuilder<B>,
> {
   build: () => DynamicModule
   identifyAs: (module: Type<any>) => B

   importModules: (
      ...module: Array<
         Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
      >
   ) => B
   exportModules: (
      ...module: Array<Type<any> | DynamicModule | ForwardReference>
   ) => B
   defineProviders: (...providers: Array<Type<any> | Provider<unknown>>) => B
   exportProviders: (...provider: Array<Type<any> | Provider<unknown>>) => B
   importDependencies: (
      ...dependencies: Array<
         [string | symbol | Type<any>, ModuleDependenciesOption]
      >
   ) => B
   makeGlobal: () => B
}

export interface IDynamicModuleBuilder
   extends IBaseDynamicModuleBuilder<IDynamicModuleBuilder> {}

export interface IDynamicModuleBlueprint
   extends IBaseDynamicModuleBuilder<IDynamicModuleBlueprint> {
   build: () => DynamicModule
}

export type IDynamicModuleDirector<
   B extends IBaseDynamicModuleBuilder<B> = IDynamicModuleBuilder,
> = Director<B>
