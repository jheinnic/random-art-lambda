import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common"

export interface IConduitModuleBuilder {
   identifyAs: (module: Type<any>) => IConduitModuleBuilder

   importModules: (
      ...module: Array<
         Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
      >
   ) => IConduitModuleBuilder
   exportModules: (
      ...module: Array<Type<any> | DynamicModule | ForwardReference>
   ) => IConduitModuleBuilder
   defineProviders: (
      ...providers: Array<Type<any> | Provider<unknown>>
   ) => IConduitModuleBuilder
   exportProviders: (
      ...provider: Array<Type<any> | Provider<unknown>>
   ) => IConduitModuleBuilder
   makeGlobal: () => IConduitModuleBuilder
}
