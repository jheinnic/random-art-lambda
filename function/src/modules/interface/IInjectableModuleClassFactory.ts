import {
   Type,
   DynamicModule,
   Provider,
   ForwardReference,
   ClassProvider,
} from "@nestjs/common"
import { IDynamicModuleDirector } from "./IDynamicModuleBuilder.js"

export interface FunctionInjectTokenArgument {
   token: string | symbol | Type
   module?: Type | DynamicModule | Promise<DynamicModule> | ForwardReference
   optional?: boolean
}

// export interface FunctionInjectProviderArgument {
//    provider: Provider
//    optional?: boolean
// }

export type FunctionInjectArgumentItem =
   | FunctionInjectTokenArgument
   // | FunctionInjectProviderArgument
   | string
   | symbol
   | Type
export type FunctionInjectArgument = FunctionInjectTokenArgument[]

export interface UseTokenForValueInjection {
   use: "token"
   for: "value"
   token: string | symbol | Type
   module?: Type | DynamicModule | Promise<DynamicModule> | ForwardReference
}

export interface UseTokenForFactoryInjection {
   use: "token"
   for: "factory"
   token: string | symbol | Type
   module?: Type | DynamicModule | Promise<DynamicModule> | ForwardReference
   method: string
   inject?: FunctionInjectArgument
}

export interface UseClassForValueInjection {
   use: "class"
   for: "value"
   provider: Type | ClassProvider
}

export interface UseClassForFactoryInjection<T extends object> {
   use: "class"
   for: "factory"
   provider: Type<T> | ClassProvider<T>
   method: {
      [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
   }[keyof T]
   inject?: FunctionInjectArgument
}

export interface UseFunctionInjection {
   use: "function"
   value: (arg: any[]) => {}
   inject?: FunctionInjectArgument
}

export interface UseValueInjection<T extends object> {
   use: "value"
   value: T
}

// Semantic sugar for UseValueInjection<string>
export interface UseStringInjection {
   use: "string"
   value: string
}

// Semantic sugar for UseValueInjection<number>
export interface UseNumberInjection {
   use: "number"
   value: number
}

export type ModuleDependenciesOption<T extends object = any> =
   | UseTokenForValueInjection
   | UseTokenForFactoryInjection
   | UseClassForValueInjection
   | UseClassForFactoryInjection<T>
   | UseFunctionInjection
   | UseValueInjection<T>
   | UseStringInjection
   | UseNumberInjection

/**
 * Conditional type that compares a proposed module dependencies type to the Config object it
 * needs to be combined with to create a public interface.   If it has no conflicting keys,
 * then all is well and the candidate is returned as-is, otherwise it is replaced by never.
 */
export type ModuleDependencies<
   InternalConfig extends object,
   T extends Record<string, string | symbol | Type>,
> =
   keyof T extends Exclude<keyof T, keyof InternalConfig>
      ? {
           [K in keyof T]: T[K]
        }
      : never

export type InjectionConfig<ImportTokens extends object> = Record<
   keyof ImportTokens,
   ModuleDependenciesOption
>
export type ExternalConfig<
   InternalConfig extends object,
   ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> = {
   [K in keyof InternalConfig | keyof ImportTokens]: (InternalConfig &
      InjectionConfig<ImportTokens>)[K]
}

export type FullModuleDirectorFactory<
   in InternalConfig extends object,
   in ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> = (
   config: InternalConfig,
   injection: InjectionConfig<ImportTokens>,
) => IDynamicModuleDirector

export type BasicModuleDirectorFactory<in InternalConfig extends object> = (
   config: InternalConfig,
) => IDynamicModuleDirector

export type ModuleDirectorFactory<
   InternalConfig extends object,
   ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> =
   | BasicModuleDirectorFactory<InternalConfig>
   | FullModuleDirectorFactory<InternalConfig, ImportTokens>

/**
 * The InjectableModuleClassFactory's build() method supplies the template types
 * when preparing an instance of this class that must be subclassed to be used.
 *
 * It has a end-user facing `forRoot()` method with a single argument of type
 * ExternalConfig, that combines the configuration interface provided when the
 * InjectableModuleClassFactory that created this was created with a set of
 * methods that collect Module and InjectionToken pair for each dynamic import
 * dependencies that was also defined at that time.
 *
 * The dependencies information is used to wire module imports and at least an
 * alias Provider mapping such that the exported offerings named through that part
 * of the External interface are bound to the injection Tokens the subclass
 * of this abstract Module class will be aware of because they were supplied
 * for that purpose when creating its InjectableModuleClassFactory.
 *
 * Wiring those dependencies is an important role of what this class is doing for
 * developers that use it behind the scenes, but it is not something that the
 * developer should have to or want to handle themselves when dealing with the
 * configuration state for an instance of their module.   That's why the Internal
 * interface is just the data interface that was initially provided to the
 * InjectableModuleClassFactory.  The forRoot() method that is part of this
 * abstract class handles the imports and strips that information from the
 * configuration object, then provides the instance of a DynamicModuleBlueprint
 * that it used to process those import to a `forRootImpl()` method that must
 * be provided by the module developer.   This is where they place the business
 * logic that interprets the data object and adds content needed to serve its
 * specification, as well as any standard routine Providers, Imports, Exports,
 * or other Nest components that are part of its business definition.  These are
 * the portions that the specified dependencies import exist to support.
 *
 * For example, in the case of the Ipld-based RegionMap repository, the
 * module that registers the concrete repository class as a Provider does so
 * in the forRootImpl() implementation of its concrete extension of a generated
 * instance of this class.   That Provider needs a concrete Blockstore implementation
 * to work with, but it does not care which particular Blockstore implementation is
 * used--we can provide a File based one, and S3-based one, local Memory cached one,
 * or even a Redis-backed Blockstore.  The implementation that accepts the
 * Blockstore implementation chosen by the root deployment module mediator is
 * found in the dependencies binding logic from the concrete repository providing
 * Module's base class, which is an instance of this class.
 *
 * This interface is public for the audience of Module developers that are building
 * concrete Providers types that want to implement a Bridge design pattern without
 * having to package all available implementations to use with their concrete
 * abstraction in the same package as those concrete abstractions themselves,
 * and/or want to use an implementation hierarchy with more than one concrete
 * abstraction without having to package all those concrete abstractions into the
 * same single Module.
 *
 * This type is not user-facing for the sake of application developer composing
 * such packages.  They should only need to know about the forRoot() method, but
 * will be calling it through a concrete subclass's public API, and the behavior
 * of the method, at a suitable level of descriptive detail, should be understood
 * through documentation found in those concrete subtypes, not this SDK-like
 * implementation detail.
 */
export interface InjectableModuleClass<
   in out InternalConfig extends object,
   in out ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> extends Type {
   // > extends Type<AbstractInjectableModule<InternalConfig, ImportTokens>> {
   forRoot: (
      args: ExternalConfig<InternalConfig, NoInfer<ImportTokens>>,
   ) => DynamicModule
}

export interface IInjectableModuleClassFactory<
   InternalConfig extends object,
   ImportTokens extends ModuleDependencies<InternalConfig, ImportTokens>,
> {
   build: () => InjectableModuleClass<InternalConfig, ImportTokens>
}
