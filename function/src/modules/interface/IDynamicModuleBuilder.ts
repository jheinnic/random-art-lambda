import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common"
import { Director, Identity } from "./Utility.js"

export interface IDynamicModuleBuilder<
   B extends IDynamicModuleBuilder = IDynamicModuleBuilder<any>,
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
   makeGlobal: () => B
}

export type DefaultDirector = Director<IDynamicModuleBuilder>
export type DefaultIdentity = Identity<DefaultDirector>
export type DefaultParams = [DefaultDirector]
