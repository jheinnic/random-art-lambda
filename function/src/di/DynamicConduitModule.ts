import {
   DynamicModule,
   Module,
   Type,
   Abstract,
   Provider,
   InjectionToken,
   ForwardReference,
} from "@nestjs/common"

export interface IConduitModuleBuilder {
   identifyAs: (module: Type<any>) => IConduitModuleBuilder
   importModules: (
      ...module: Array<Type<any> | DynamicModule>
   ) => IConduitModuleBuilder
   importModule: (module: Type<any> | DynamicModule) => IConduitModuleBuilder
   addProviders: (
      ...providers: Array<Provider<unknown>>
   ) => IConduitModuleBuilder
   addProvider: (provider: Provider<unknown>) => IConduitModuleBuilder
   useExisting: (
      tokenMap: Map<Type<any> | InjectionToken, InjectionToken[]>,
   ) => IConduitModuleBuilder
   addExport: (
      exportable:
         | Type<any>
         | DynamicModule
         | Provider<unknown>
         | InjectionToken,
   ) => IConduitModuleBuilder
   addExports: (
      ...exportable: Array<
         Type<any> | DynamicModule | Provider<unknown> | InjectionToken
      >
   ) => IConduitModuleBuilder
   makeGlobal: () => IConduitModuleBuilder
}

@Module({})
export class DynamicConduitModule {
   public static registerModule(
      director: (builder: IConduitModuleBuilder) => void,
   ): DynamicModule {
      const moduleFactoryBuilder = new ConduitModuleBuilder()
      director(moduleFactoryBuilder)
      return moduleFactoryBuilder.build()
   }
}

class ConduitModuleBuilder implements IConduitModuleBuilder {
   private delegate: ConduitModuleDelegate
   constructor() {
      this.delegate = new ConduitModuleDelegate()
   }

   identifyAs(module: Type<any>): IConduitModuleBuilder {
      this.delegate.identifyAs(module)
      return this
   }

   importModules(
      ...modules: Array<Type<any> | DynamicModule>
   ): IConduitModuleBuilder {
      this.delegate.importModules(...modules)
      return this
   }

   importModule(module: Type<any> | DynamicModule): IConduitModuleBuilder {
      this.delegate.importModule(module)
      return this
   }

   addProviders(...providers: Array<Provider<unknown>>): IConduitModuleBuilder {
      this.delegate.addProviders(...providers)
      return this
   }

   addProvider(provider: Provider<unknown>): IConduitModuleBuilder {
      this.delegate.addProvider(provider)
      return this
   }

   useExisting(
      tokenMap: Map<Type<any> | InjectionToken, InjectionToken[]>,
   ): IConduitModuleBuilder {
      this.delegate.useExisting(tokenMap)
      return this
   }

   addExport(
      exportable:
         | Type<any>
         | DynamicModule
         | Provider<unknown>
         | InjectionToken,
   ): IConduitModuleBuilder {
      this.delegate.addExport(exportable)
      return this
   }

   addExports(
      ...exportable: Array<
         Type<any> | DynamicModule | Provider<unknown> | InjectionToken
      >
   ): IConduitModuleBuilder {
      this.delegate.addExports(...exportable)
      return this
   }

   makeGlobal(): IConduitModuleBuilder {
      this.delegate.makeGlobal()
      return this
   }

   build(): DynamicModule {
      const oldDelegate = this.delegate
      const retVal = oldDelegate.build()
      this.delegate = new ConduitModuleDelegate()
      this.delegate.importModule(retVal)
      this.delegate.addExport(retVal)
      return retVal
   }
}

class ConduitModuleDelegate {
   private module: Type<any> | undefined

   private global: boolean = false

   private readonly imports: Array<
      Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
   > = []

   private readonly providers: Array<Provider<unknown>> = []

   private readonly exports: Array<
      | DynamicModule
      | string
      | symbol
      | Provider
      | ForwardReference
      | Abstract<any>
      | Function
   > = []

   private readonly useExistingTokens: Map<
      Type<any> | InjectionToken,
      InjectionToken[]
   > = new Map()

   identifyAs(module: Type<any>): IConduitModuleBuilder {
      if (this.module !== undefined) {
         throw new Error("Identity already assigned")
      }
      this.module = module
      return this
   }

   importModules(
      ...module: Array<Type<any> | DynamicModule>
   ): IConduitModuleBuilder {
      this.imports.unshift(...module)
      return this
   }

   importModule(module: Type<any> | DynamicModule): IConduitModuleBuilder {
      this.imports.unshift(module)
      return this
   }

   addProviders(...providers: Array<Provider<unknown>>): IConduitModuleBuilder {
      this.providers.unshift(...providers)
      return this
   }

   addProvider(provider: Provider<unknown>): IConduitModuleBuilder {
      this.providers.unshift(provider)
      return this
   }

   useExisting(
      tokenMap: Map<Type<unknown> | InjectionToken, InjectionToken[]>,
   ): IConduitModuleBuilder {
      for (const x of tokenMap.keys()) {
         const tokens: InjectionToken[] | undefined = tokenMap.get(x)
         if (tokens === undefined) {
            continue
         }
         let aliases: InjectionToken[] | undefined
         if (this.useExistingTokens.has(x)) {
            aliases = this.useExistingTokens.get(x)
         }
         if (aliases === undefined) {
            aliases = []
            this.useExistingTokens.set(x, aliases)
         }
         aliases.unshift(...tokens)
      }
      return this
   }

   addExport(
      exportable: Type | Provider<unknown> | DynamicModule | InjectionToken,
   ): IConduitModuleBuilder {
      this.exports.unshift(exportable)
      return this
   }

   addExports(
      ...exportable: Array<
         Type | Provider<unknown> | DynamicModule | InjectionToken
      >
   ): IConduitModuleBuilder {
      this.exports.unshift(...exportable)
      return this
   }

   makeGlobal(): IConduitModuleBuilder {
      this.global = true
      return this
   }

   build(): DynamicModule {
      for (const entry of this.useExistingTokens.entries()) {
         this.providers.unshift(
            ...entry[1].map((x: InjectionToken) => {
               return {
                  provide: x,
                  useExisting: entry[0],
               }
            }),
         )
      }

      return {
         module: this.module ?? ConduitModuleBuilder,
         imports: this.imports,
         providers: this.providers,
         exports: this.exports,
         global: this.global,
      }
   }
}
