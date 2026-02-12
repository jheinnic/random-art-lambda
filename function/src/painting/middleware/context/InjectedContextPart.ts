/**
 * Injected Context Part
 *
 * Utilities for creating context parts backed by NestJS dependency injection.
 * These parts delegate to services provided by the NestJS container.
 *
 * Key concepts:
 * - InjectedContextPart wraps NestJS services as context parts
 * - The part implements an abstract contract (e.g., HasFileStore)
 * - At runtime, the actual service is resolved via NestJS DI
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
   DELEGATED_INJECT,
   CONTEXT_PART_METADATA,
   type ContextPartOptions,
   type ContextPartConstructor,
   type DelegatedInjectMetadata,
} from "./ContextPartMetadata.js"
import {
   privateContextualize,
   applyContextPartMetadata,
   type MiddlewareContextConstructor,
} from "./Contextualize.js"

// ============================================================================
// Types for Injection-Backed Parts
// ============================================================================

/**
 * Token types that can be used for NestJS injection
 */
export type InjectionToken<T = unknown> =
   | string
   | symbol
   | (new (...args: any[]) => T)
   | { new (...args: any[]): T }

/**
 * Descriptor for a single injected dependency
 */
export interface InjectedDependencyDescriptor<T = unknown> {
   /** The property name on the context part */
   readonly propertyName: string
   /** The NestJS injection token */
   readonly token: InjectionToken<T>
   /** Optional: whether this is optional injection */
   readonly optional?: boolean
}

/**
 * Options for creating an injection-backed context part
 */
export interface InjectedPartOptions<K extends object>
   extends ContextPartOptions {
   /**
    * Map of property names to injection tokens.
    * These will be resolved from the NestJS container at runtime.
    */
   readonly injections: {
      [P in keyof K]?: InjectionToken<K[P]>
   }
}

/**
 * Factory function signature for creating injected parts
 */
export type InjectedPartFactory<K extends object> = (
   injectedDependencies: K,
) => MiddlewareContextConstructor<object, K>

/**
 * Extended injection metadata that supports class constructor tokens
 * (internally used, while DelegatedInjectMetadata uses string | symbol)
 */
export interface ExtendedInjectionMetadata {
   readonly propertyName: string
   readonly token: InjectionToken
   readonly optional: boolean
}

/**
 * Symbol for storing extended injection metadata (with class constructor support)
 */
export const EXTENDED_INJECT_META: unique symbol = Symbol("ExtendedInjectMeta")

// ============================================================================
// Injected Context Part Factory
// ============================================================================

/**
 * Creates a context part that wraps NestJS-injected services.
 *
 * This is used for concrete providers that satisfy abstract contracts
 * by delegating to NestJS-managed services.
 *
 * @typeParam K - The shape of the dependencies this part provides
 * @param abstractContract - The abstract class this part provides
 * @param options - Configuration including injection tokens
 * @returns A MiddlewareContextConstructor that wraps the injected services
 *
 * @example
 * ```typescript
 * // Abstract contract
 * @ContextPart({ isAbstract: true, visibility: "private" })
 * abstract class HasFileStore {
 *    abstract readonly fileStore: IFileStore
 * }
 *
 * // Concrete provider using NestJS injection
 * const InjectedFileStorePart = createInjectedPart<{ fileStore: IFileStore }>(
 *    HasFileStore,
 *    {
 *       name: "InjectedFileStorePart",
 *       provides: [HasFileStore],
 *       injections: {
 *          fileStore: FILE_STORE_TOKEN,
 *       },
 *    }
 * )
 * ```
 */
export function createInjectedPart<K extends object>(
   abstractContract: ContextPartConstructor,
   options: InjectedPartOptions<K>,
): MiddlewareContextConstructor<object, K> {
   // Build injection metadata from options
   const injectionEntries = Object.entries(options.injections) as Array<
      [string, InjectionToken<unknown>]
   >

   // Build metadata - store extended token info separately since
   // DelegatedInjectMetadata.token is symbol | string
   const delegatedInjectMeta = injectionEntries.map(
      ([propertyName, token]) => ({
         propertyName,
         // Convert class constructors to their name as a string token
         token:
            typeof token === "function"
               ? (token.name as string)
               : (token as symbol | string),
      }),
   ) satisfies DelegatedInjectMetadata[]

   // Store extended metadata with full token types for the resolver
   const extendedMeta: ExtendedInjectionMetadata[] = injectionEntries.map(
      ([propertyName, token]) => ({
         propertyName,
         token,
         optional: false,
      }),
   )

   // Create a placeholder class with the expected properties
   const PlaceholderClass = class {} as new () => K

   // Define properties on the prototype so privateContextualize can find them
   for (const [propertyName] of injectionEntries) {
      Object.defineProperty(PlaceholderClass.prototype, propertyName, {
         value: undefined,
         writable: true,
         enumerable: true,
         configurable: true,
      })
   }

   // Create the contextualized part
   const ContextualizedPart = privateContextualize(PlaceholderClass, {
      ...options,
      visibility: "private",
      provides: options.provides ?? [abstractContract],
   })

   // Attach the delegated inject metadata (for compatibility with decorator system)
   Object.defineProperty(ContextualizedPart, DELEGATED_INJECT, {
      value: delegatedInjectMeta,
      writable: false,
      enumerable: false,
      configurable: false,
   })

   // Attach extended metadata (with full token types for the resolver)
   Object.defineProperty(ContextualizedPart, EXTENDED_INJECT_META, {
      value: extendedMeta,
      writable: false,
      enumerable: false,
      configurable: false,
   })

   return ContextualizedPart as MiddlewareContextConstructor<object, K>
}

// ============================================================================
// Injected Part Builder (Fluent API)
// ============================================================================

/**
 * Builder for creating injection-backed context parts with a fluent API.
 *
 * @example
 * ```typescript
 * const InjectedFileStorePart = InjectedPartBuilder
 *    .provides(HasFileStore)
 *    .named("InjectedFileStorePart")
 *    .inject("fileStore", FILE_STORE_TOKEN)
 *    .build<{ fileStore: IFileStore }>()
 * ```
 */
export class InjectedPartBuilder<K extends object = object> {
   private _name?: string
   private _provides: ContextPartConstructor[] = []
   private _dependsOn: ContextPartConstructor[] = []
   private _injections: Map<string, InjectionToken<unknown>> = new Map()
   private _priority?: number

   private constructor() {}

   /**
    * Start building a new injected part that provides the given contract
    */
   static provides(abstractContract: ContextPartConstructor): InjectedPartBuilder {
      const builder = new InjectedPartBuilder()
      builder._provides.push(abstractContract)
      return builder
   }

   /**
    * Set the name for this part
    */
   named(name: string): this {
      this._name = name
      return this
   }

   /**
    * Add additional contracts this part provides
    */
   alsoProvides(abstractContract: ContextPartConstructor): this {
      this._provides.push(abstractContract)
      return this
   }

   /**
    * Declare a dependency on another context part
    */
   dependsOn(part: ContextPartConstructor): this {
      this._dependsOn.push(part)
      return this
   }

   /**
    * Add an injection mapping
    */
   inject<T>(propertyName: string, token: InjectionToken<T>): this {
      this._injections.set(propertyName, token)
      return this
   }

   /**
    * Set the assembly priority
    */
   priority(level: number): this {
      this._priority = level
      return this
   }

   /**
    * Build the injected context part
    */
   build<T extends K>(): MiddlewareContextConstructor<object, T> {
      if (this._provides.length === 0) {
         throw new Error("InjectedPartBuilder requires at least one provided contract")
      }

      const injections: Record<string, InjectionToken<unknown>> = {}
      for (const [key, token] of Array.from(this._injections)) {
         injections[key] = token
      }

      return createInjectedPart<T>(this._provides[0], {
         name: this._name ?? `Injected${this._provides[0].name}`,
         provides: this._provides,
         dependsOn: this._dependsOn,
         priority: this._priority,
         injections: injections as { [P in keyof T]?: InjectionToken<T[P]> },
      })
   }
}

// ============================================================================
// Runtime Injection Resolver
// ============================================================================

/**
 * Resolver that extracts injection metadata from a part and provides
 * the resolved dependencies at runtime.
 *
 * This is used by the MiddlewareFactory to wire up NestJS dependencies
 * before assembling the context.
 */
export class InjectionResolver {
   /**
    * Get all injection requirements from a context part (basic metadata)
    */
   static getInjectionRequirements(
      part: ContextPartConstructor,
   ): DelegatedInjectMetadata[] {
      return (part as any)[DELEGATED_INJECT] ?? []
   }

   /**
    * Get extended injection metadata (with full token types including class constructors)
    */
   static getExtendedInjectionRequirements(
      part: ContextPartConstructor,
   ): ExtendedInjectionMetadata[] {
      // Prefer extended metadata if available
      const extended = (part as any)[EXTENDED_INJECT_META]
      if (extended != null) {
         return extended
      }
      // Fall back to basic metadata
      return this.getInjectionRequirements(part).map((m) => ({
         propertyName: m.propertyName,
         token: m.token,
         optional: false,
      }))
   }

   /**
    * Check if a part has any injection requirements
    */
   static hasInjections(part: ContextPartConstructor): boolean {
      const meta = (part as any)[DELEGATED_INJECT]
      const extended = (part as any)[EXTENDED_INJECT_META]
      return (meta != null && meta.length > 0) || (extended != null && extended.length > 0)
   }

   /**
    * Get the injection token for a specific property
    */
   static getTokenForProperty(
      part: ContextPartConstructor,
      propertyName: string,
   ): InjectionToken | undefined {
      const meta = this.getExtendedInjectionRequirements(part)
      return meta.find((m) => m.propertyName === propertyName)?.token
   }

   /**
    * Create a dependency object from resolved injections.
    *
    * @param part - The context part to resolve for
    * @param resolver - Function that resolves injection tokens to instances
    * @returns Object with resolved dependencies keyed by property name
    */
   static resolveInjections<K extends object>(
      part: ContextPartConstructor,
      resolver: <T>(token: InjectionToken<T>) => T,
   ): K {
      const requirements = this.getExtendedInjectionRequirements(part)
      const resolved: Record<string, unknown> = {}

      for (const req of requirements) {
         resolved[req.propertyName] = resolver(req.token)
      }

      return resolved as K
   }
}
