import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common"
import { IDynamicModuleBuilder } from "./IDynamicModuleBuilder.js"

export interface IDynamicModuleBlueprint extends IDynamicModuleBuilder {
   build: () => DynamicModule
   identifyAs: (module: Type<any>) => IDynamicModuleBuilder

   importModules: (
      ...module: Array<
         Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
      >
   ) => IDynamicModuleBuilder
   exportModules: (
      ...module: Array<Type<any> | DynamicModule | ForwardReference>
   ) => IDynamicModuleBuilder
   defineProviders: (
      ...providers: Array<Type<any> | Provider<unknown>>
   ) => IDynamicModuleBuilder
   exportProviders: (
      ...provider: Array<Type<any> | Provider<unknown>>
   ) => IDynamicModuleBuilder
   makeGlobal: () => IDynamicModuleBuilder
}
