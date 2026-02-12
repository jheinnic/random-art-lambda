import {
   Type,
   DynamicModule,
   ForwardReference,
   Provider,
   Abstract,
   OptionalFactoryDependency,
} from "@nestjs/common"
import { IDynamicModuleBlueprint } from "../interface/IDynamicModuleBuilder.js"
import {
   FunctionInjectTokenArgument,
   ModuleDependenciesOption,
} from "../interface/IInjectableModuleClassFactory.js"

export class DynamicModuleBlueprint implements IDynamicModuleBlueprint {
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

   identifyAs(module: Type<any>): IDynamicModuleBlueprint {
      this._verifyMutability()
      this.module = module
      return this
   }

   importModules(
      ...modules: Array<
         Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
      >
   ): IDynamicModuleBlueprint {
      this._verifyMutability()
      this.imports.unshift(...modules)
      return this
   }

   exportModules(
      ...modules: Array<Type<any> | DynamicModule | ForwardReference>
   ): IDynamicModuleBlueprint {
      this._verifyMutability()
      this.imports.unshift(...modules)
      this.exports.unshift(
         ...modules.map((x) => {
            if ("module" in x) {
               return x.module
            }
            return x
         }),
      )
      return this
   }

   defineProviders(
      ...providers: Array<Type<any> | Provider<unknown>>
   ): IDynamicModuleBlueprint {
      this._verifyMutability()
      this.providers.unshift(...providers)
      return this
   }

   exportProviders(
      ...providers: Array<Type<any> | Provider<unknown>>
   ): IDynamicModuleBlueprint {
      this._verifyMutability()
      this.providers.unshift(...providers)
      this.exports.unshift(...providers)
      return this
   }

   importDependencies(
      ...dependencies: Array<
         [string | symbol | Type<any>, ModuleDependenciesOption]
      >
   ): IDynamicModuleBlueprint {
      this._verifyMutability()
      dependencies.forEach(
         ([provideToToken, diConfig]: [
            string | symbol | Type<any>,
            ModuleDependenciesOption,
         ]): void => {
            switch (diConfig.use) {
               case "token": {
                  if (diConfig.module !== undefined) {
                     this.importModules(diConfig.module)
                  }
                  const consumeFromToken = diConfig.token
                  switch (diConfig.for) {
                     case "factory": {
                        const paramTokens: OptionalFactoryDependency[] =
                           this.prepareInjectTokens(diConfig.inject ?? [])
                        this.exportProviders({
                           provide: provideToToken,
                           useFactory: (x: any, ...params: any[]) => {
                              return x[diConfig.method](...params)
                           },
                           inject: [consumeFromToken, ...paramTokens],
                        })
                        break
                     }
                     case "value": {
                        this.exportProviders({
                           provide: provideToToken,
                           useExisting: consumeFromToken,
                        })
                        break
                     }
                  }
                  break
               }
               case "class": {
                  this.exportProviders(diConfig.provider)
                  switch (diConfig.for) {
                     case "factory": {
                        const paramTokens: OptionalFactoryDependency[] =
                           this.prepareInjectTokens(diConfig.inject ?? [])
                        this.exportProviders({
                           provide: provideToToken,
                           useFactory: (x: any, ...params: any[]): any =>
                              x[diConfig.method](...params),
                           inject: [
                              typeof diConfig.provider === "function"
                                 ? diConfig.provider
                                 : diConfig.provider.provide,
                              ...paramTokens,
                           ],
                        })
                        break
                     }
                     case "value": {
                        this.exportProviders({
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
                  const paramTokens: OptionalFactoryDependency[] =
                     this.prepareInjectTokens(diConfig.inject ?? [])
                  this.exportProviders({
                     provide: provideToToken,
                     useFactory: diConfig.value,
                     inject: paramTokens,
                  })
                  break
               }
               case "number":
               case "string":
               case "value": {
                  this.exportProviders({
                     provide: provideToToken,
                     useValue: diConfig.value,
                  })
                  break
               }
               default: {
                  // TODO: Replace this with an exhaustiveness check!
                  this.exportProviders({
                     provide: provideToToken,
                     useValue: diConfig,
                  })
               }
            }
         },
      )
      return this
   }

   makeGlobal(): IDynamicModuleBlueprint {
      this._verifyMutability()
      this.global = true
      return this
   }

   private prepareInjectTokens(
      injectArgs: FunctionInjectTokenArgument[],
   ): OptionalFactoryDependency[] {
      this.importModules(
         ...injectArgs
            .filter((param: FunctionInjectTokenArgument): boolean => {
               return param.module != null
            })
            .map(
               (
                  param: FunctionInjectTokenArgument,
               ):
                  | Type<any>
                  | DynamicModule
                  | Promise<DynamicModule>
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  | ForwardReference => param.module!,
            ),
      )
      return injectArgs.map(
         (param: FunctionInjectTokenArgument): OptionalFactoryDependency => {
            return {
               token: param.token,
               optional: param.optional ?? false,
            }
         },
      )
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
