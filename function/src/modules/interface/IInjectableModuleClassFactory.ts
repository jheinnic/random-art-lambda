import { InjectionToken, Type, DynamicModule, Provider } from "@nestjs/common"
import { DefaultDirector } from "./IDynamicModuleBuilder.js"
import { CombineObjects } from "simplytyped"

export interface FunctionInjectTokenArgument {
   token: InjectionToken
   module?: Type | DynamicModule
   optional?: boolean
}

export interface FunctionInjectProviderArgument {
   provider: Type | Provider
   module?: Type | DynamicModule
   optional?: boolean
}

export type FunctionInjectArgumentItem =
   | FunctionInjectTokenArgument
   | FunctionInjectProviderArgument
   | InjectionToken
export type FunctionInjectArgument = FunctionInjectArgumentItem[]

export interface UseTokenForValueInjection {
   use: "token"
   for: "value"
   token: InjectionToken
   module?: Type | DynamicModule
}

export interface UseTokenForFactoryInjection {
   use: "token"
   for: "factory"
   token: InjectionToken
   module?: Type | DynamicModule
   method: string
}

export interface UseProviderForValueInjection {
   use: "provider"
   for: "value"
   provider: Type | Provider
   module?: Type | DynamicModule
}

export interface UseProviderForFactoryInjection {
   use: "provider"
   for: "factory"
   provider: Type | Provider
   module?: Type | DynamicModule
   method: string
}

export interface UseFunctionInjection {
   use: "function"
   value: (arg: any[]) => {}
   inject?: FunctionInjectArgument
}

export interface UseValueInjection {
   use: "value"
   value: any
}

export type ModuleDependencyOption =
   | UseTokenForValueInjection
   | UseTokenForFactoryInjection
   | UseProviderForValueInjection
   | UseProviderForFactoryInjection
   | UseFunctionInjection
   | UseValueInjection

export type ModuleDependents = Record<string, string | symbol | Type>

export type InjectionConfig<ImportTokens extends ModuleDependents> = Record<
   keyof ImportTokens,
   ModuleDependencyOption
>

export type ExternalConfig<
   InternalConfig extends {},
   ImportTokens extends ModuleDependents,
> = CombineObjects<InternalConfig, InjectionConfig<ImportTokens>>

interface DynamicModulePart<
   in InternalConfig extends {},
   in ImportTokens extends ModuleDependents,
> {
   forRoot: (
      ...args: [ExternalConfig<InternalConfig, ImportTokens>]
   ) => DynamicModule
}

type ExtensionPart<in Params extends {}, in MethodName extends string> = {
   [K in MethodName]: (...args: [Params]) => DefaultDirector
}

/**
 * The InjectableModuleClassFactory's build() method supplies the template types
 * when preparing an instance of this class that must be subclassed to be used.
 *
 * It has a end-user facing `forRoot()` method with a single argument of type
 * ExternalConfig, that combines the configuration interface provided when the
 * InjectableModuleClassFactory that created this was created with a set of
 * methods that collect Module and InjectionToken pair for each dynamic import
 * dependency that was also defined at that time.
 *
 * The dependency information is used to wire module imports and at least an
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
 * the portions that the specified dependency import exist to support.
 *
 * For example, in the case of the Ipld-based RegionMap repository, the
 * module that registers the concrete repository class as a Provider does so
 * in the forRootImpl() implementation of its concrete extension of a generated
 * instance of this class.   That Provider needs a concrete Blockstore implementation
 * to work with, but it does not care which particular Blockstore implementation is
 * used--we can provide a File based one, and S3-based one, local Memory cached one,
 * or even a Redis-backed Blockstore.  The implementation that accepts the
 * Blockstore implementation chosen by the root deployment module mediator is
 * found in the dependency binding logic from the concrete repository providing
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
export type AbstractInjectableModule<
   InternalConfig extends {},
   ImportTokens extends {},
   ExtensionMethodName extends string,
> = (new () => any) &
   DynamicModulePart<InternalConfig, ImportTokens> &
   ExtensionPart<InternalConfig, ExtensionMethodName>

export interface IInjectableModuleClassFactory<
   InternalConfig extends {},
   ImportTokens extends Record<string, string | symbol | Type>,
   ExtensionMethodName extends string,
> {
   build: () => AbstractInjectableModule<
      InternalConfig,
      ImportTokens,
      ExtensionMethodName
   >
}
