import { DynamicModule, ForwardReference, Provider, Type } from "@nestjs/common"

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
