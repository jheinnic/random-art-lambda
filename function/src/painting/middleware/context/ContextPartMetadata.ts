/**
 * Context Part Metadata and Annotations
 *
 * This module defines the metadata system for composable context parts.
 * Parts can be:
 * - Abstract: Define a contract that must be provided by another part
 * - Concrete: Provide implementation for abstract contracts
 * - Business Logic: Pure code-based implementations
 * - Injection-backed: Backed by NestJS dependency injection
 * - Expression-backed: Methods backed by compiled expressions
 */

import "reflect-metadata"

// ============================================================================
// Metadata Symbols
// ============================================================================

/**
 * Symbol for storing ContextPart metadata on a class
 */
export const CONTEXT_PART_METADATA: unique symbol = Symbol("ContextPartMetadata")

/**
 * Symbol for storing the list of method names on a MiddlewareContextConstructor
 */
export const METHODS: unique symbol = Symbol("Methods")

/**
 * Symbol for storing action entries on an Activity class
 */
export const ACTION_ENTRIES: unique symbol = Symbol("ActionEntries")

/**
 * Symbol for storing delegated injection metadata
 */
export const DELEGATED_INJECT: unique symbol = Symbol("DelegatedInject")

/**
 * Symbol for storing expression-backed method metadata
 */
export const EXPRESSION_METHOD: unique symbol = Symbol("ExpressionMethod")

// ============================================================================
// Core Metadata Types
// ============================================================================

/**
 * Visibility determines where properties/methods are accessible in the context
 */
export type ContextVisibility = "public" | "private"

/**
 * Base interface for context part references
 */
export interface ContextPartRef {
   /** The part class */
   readonly partClass: ContextPartConstructor
   /** The part's unique name */
   readonly name: string
}

/**
 * Metadata for a Context Part, provided via the @ContextPart decorator
 */
export interface ContextPartMetadata {
   /**
    * Unique name for this context part.
    * Used for logging, debugging, and dependency resolution.
    */
   readonly name: string

   /**
    * Whether this is an abstract contract (vs concrete implementation).
    * Abstract parts cannot be instantiated directly but define interfaces
    * that concrete parts must provide.
    */
   readonly isAbstract: boolean

   /**
    * Abstract contracts this part provides implementations for.
    * Concrete parts must declare what abstract parts they satisfy.
    */
   readonly provides: ContextPartRef[]

   /**
    * Abstract contracts this part depends on.
    * The assembly process validates these are satisfied.
    */
   readonly dependsOn: ContextPartRef[]

   /**
    * Whether properties/methods are exposed publicly or privately.
    * - "public": Properties go to `context`, methods go to `_methods`
    * - "private": Properties go to `_context`, methods are internal
    */
   readonly visibility: ContextVisibility

   /**
    * Priority for ordering when merging parts.
    * Lower numbers are processed first.
    * @default 100
    */
   readonly priority?: number
}

/**
 * Options for the @ContextPart decorator (allows partial specification)
 */
export interface ContextPartOptions {
   readonly name?: string
   readonly isAbstract?: boolean
   readonly provides?: ContextPartConstructor[]
   readonly dependsOn?: ContextPartConstructor[]
   readonly visibility?: ContextVisibility
   readonly priority?: number
}

// ============================================================================
// Injection Metadata
// ============================================================================

/**
 * Metadata for delegated NestJS injection
 */
export interface DelegatedInjectMetadata {
   /** The property name to inject into */
   readonly propertyName: string
   /** The NestJS injection token */
   readonly token: symbol | string
   /** Optional factory to transform the injected value */
   readonly factory?: (value: unknown) => unknown
}

/**
 * Metadata for expression-backed methods
 */
export interface ExpressionMethodMetadata {
   /** The method name */
   readonly methodName: string
   /** The expression string to compile and execute */
   readonly expression: string
   /** Context fields the expression can access */
   readonly contextFields: string[]
}

// ============================================================================
// Constructor Types
// ============================================================================

/**
 * Base constructor interface for context parts
 */
export interface ContextPartConstructor {
   new (...args: unknown[]): unknown
   readonly [CONTEXT_PART_METADATA]?: ContextPartMetadata
   readonly [METHODS]?: string[]
   readonly [ACTION_ENTRIES]?: MethodActionEntry[]
   readonly [DELEGATED_INJECT]?: DelegatedInjectMetadata[]
   readonly [EXPRESSION_METHOD]?: ExpressionMethodMetadata[]
}

/**
 * Action entry for consumer-specific method annotations
 */
export interface MethodActionEntry {
   methodName: string
   metadata: ActionMetadata
}

/**
 * Metadata for action annotations on methods
 */
export interface ActionMetadata {
   /** Discriminator identifying which consumer should invoke this action */
   readonly consumer: string | symbol
   /** Execution priority within that consumer's action set (lower = earlier) */
   readonly priority: number
}

// ============================================================================
// Metadata Helpers
// ============================================================================

/**
 * Get the ContextPart metadata from a class
 */
export function getContextPartMetadata(
   target: ContextPartConstructor,
): ContextPartMetadata | undefined {
   return target[CONTEXT_PART_METADATA]
}

/**
 * Get the method names from a contextualized class
 */
export function getContextPartMethods(
   target: ContextPartConstructor,
): string[] {
   return (target[METHODS] as string[] | undefined) ?? []
}

/**
 * Get action entries from a class
 */
export function getActionEntries(
   target: ContextPartConstructor,
): MethodActionEntry[] {
   return target[ACTION_ENTRIES] ?? []
}

/**
 * Get delegated injection metadata from a class
 */
export function getDelegatedInjectMetadata(
   target: ContextPartConstructor,
): DelegatedInjectMetadata[] {
   return target[DELEGATED_INJECT] ?? []
}

/**
 * Get expression method metadata from a class
 */
export function getExpressionMethodMetadata(
   target: ContextPartConstructor,
): ExpressionMethodMetadata[] {
   return target[EXPRESSION_METHOD] ?? []
}

// ============================================================================
// Decorator: @ContextPart
// ============================================================================

/**
 * Decorator to mark a class as a Context Part.
 *
 * Context Parts are composable units that contribute to the accumulated
 * context object. Each part can:
 * - Declare abstract dependencies it needs
 * - Provide concrete implementations for abstract parts
 * - Contribute properties and methods to the context
 *
 * @example
 * ```typescript
 * // Abstract contract - declares what must be provided
 * @ContextPart({ isAbstract: true, visibility: "private" })
 * abstract class HasFileStore {
 *    abstract readonly fileStore: IFileStore
 * }
 *
 * // Concrete provider - satisfies the contract
 * @ContextPart({
 *    provides: [HasFileStore],
 *    visibility: "private",
 * })
 * class InjectedFileStorePart {
 *    constructor(
 *       @DelegatedInject(FILE_STORE_TOKEN)
 *       public readonly fileStore: IFileStore
 *    ) {}
 * }
 *
 * // Consumer - depends on the contract
 * @ContextPart({
 *    dependsOn: [HasFileStore, HasPathNaming],
 *    visibility: "private",
 * })
 * class ImageStagingActivity {
 *    constructor(
 *       private readonly fileStore: IFileStore,
 *       private readonly pathNaming: IPathNaming,
 *    ) {}
 *
 *    @GatheringWorkerAction({ priority: 10 })
 *    async stage(imageBuffer: Buffer): Promise<StagedResult> {
 *       const path = this.pathNaming.getPath()
 *       return this.fileStore.write(path, imageBuffer)
 *    }
 * }
 * ```
 */
export function ContextPart(options: ContextPartOptions = {}): ClassDecorator {
   return (target) => {
      const name = options.name ?? target.name

      // Convert provides/dependsOn arrays to ContextPartRef arrays
      const provides: ContextPartRef[] = (options.provides ?? []).map(
         (partClass) => ({
            partClass,
            name: getContextPartMetadata(partClass)?.name ?? partClass.name,
         }),
      )

      const dependsOn: ContextPartRef[] = (options.dependsOn ?? []).map(
         (partClass) => ({
            partClass,
            name: getContextPartMetadata(partClass)?.name ?? partClass.name,
         }),
      )

      const metadata: ContextPartMetadata = {
         name,
         isAbstract: options.isAbstract ?? false,
         provides,
         dependsOn,
         visibility: options.visibility ?? "public",
         priority: options.priority,
      }

      // Store on the class
      Object.defineProperty(target, CONTEXT_PART_METADATA, {
         value: metadata,
         writable: false,
         enumerable: false,
         configurable: false,
      })

      // Also store via Reflect for compatibility
      Reflect.defineMetadata(CONTEXT_PART_METADATA, metadata, target)
   }
}

// ============================================================================
// Decorator: @DelegatedInject
// ============================================================================

/**
 * Parameter decorator to mark a constructor parameter for delegated NestJS injection.
 *
 * Unlike regular @Inject, this is processed by the context assembly system,
 * which coordinates with NestJS to provide the value when the context is created.
 *
 * @param token - The NestJS injection token
 * @param propertyName - Optional property name (defaults to parameter name)
 *
 * @example
 * ```typescript
 * @ContextPart({ provides: [HasFileStore] })
 * class InjectedFileStorePart {
 *    constructor(
 *       @DelegatedInject(FILE_STORE_TOKEN, "fileStore")
 *       public readonly fileStore: IFileStore
 *    ) {}
 * }
 * ```
 */
export function DelegatedInject(
   token: symbol | string,
   propertyName?: string,
): ParameterDecorator {
   return (target, _propertyKey, parameterIndex) => {
      const ctor = target as unknown as ContextPartConstructor

      // Initialize array if needed
      if (ctor[DELEGATED_INJECT] == null) {
         Object.defineProperty(ctor, DELEGATED_INJECT, {
            value: [],
            writable: false,
            enumerable: false,
            configurable: false,
         })
      }

      // Try to get parameter name from metadata
      const paramNames =
         Reflect.getMetadata("design:paramnames", target) ?? []
      const inferredName = paramNames[parameterIndex] ?? `param${parameterIndex}`

      const metadata: DelegatedInjectMetadata = {
         propertyName: propertyName ?? inferredName,
         token,
      }

      ;(ctor[DELEGATED_INJECT] as DelegatedInjectMetadata[]).push(metadata)
   }
}

// ============================================================================
// Decorator Factory: createActionDecorator
// ============================================================================

/**
 * Factory to create consumer-specific action decorators.
 *
 * Each consumer (GatheringWorker, ProjectCompletionWorker, etc.) should
 * create its own decorator using this factory.
 *
 * @param consumer - Unique discriminator for the consumer
 * @returns A decorator factory that accepts priority and other options
 *
 * @example
 * ```typescript
 * // In the GatheringWorker module:
 * export const GatheringWorkerAction = createActionDecorator("gathering-worker")
 *
 * // In an Activity class:
 * class ImageStagingActivity {
 *    @GatheringWorkerAction({ priority: 10 })
 *    async stage(imageBuffer: Buffer): Promise<StagedResult> { ... }
 * }
 * ```
 */
export function createActionDecorator(
   consumer: string | symbol,
): (options: Omit<ActionMetadata, "consumer">) => MethodDecorator {
   return function (
      options: Omit<ActionMetadata, "consumer">,
   ): MethodDecorator {
      return function <T>(
         target: object,
         propertyKey: string | symbol,
         _descriptor: TypedPropertyDescriptor<T>,
      ): void {
         const ctor = target.constructor as ContextPartConstructor

         // Initialize array if needed
         if (ctor[ACTION_ENTRIES] == null) {
            Object.defineProperty(ctor, ACTION_ENTRIES, {
               value: [],
               writable: false,
               enumerable: false,
               configurable: false,
            })
         }

         ;(ctor[ACTION_ENTRIES] as MethodActionEntry[]).push({
            methodName: String(propertyKey),
            metadata: { consumer, ...options },
         })
      }
   }
}

/**
 * Get all action entries for a given consumer from a class
 */
export function getActionsForConsumer(
   ctor: ContextPartConstructor,
   consumer: string | symbol,
): MethodActionEntry[] {
   const entries = ctor[ACTION_ENTRIES] ?? []
   return entries
      .filter((entry) => entry.metadata.consumer === consumer)
      .sort((a, b) => a.metadata.priority - b.metadata.priority)
}

// ============================================================================
// Decorator: @ExpressionMethod
// ============================================================================

/**
 * Method decorator to mark a method as expression-backed.
 *
 * The method implementation will be generated from the expression string
 * at context assembly time. The expression has access to context fields.
 *
 * @param expression - The expression string
 * @param contextFields - Context fields the expression can access
 *
 * @example
 * ```typescript
 * @ContextPart({ dependsOn: [BaseModelPart, BuiltInFunctionsPart] })
 * class ExpressionPathNamePart {
 *    @ExpressionMethod(
 *       "`${prefixAsUtf8()}_${suffixAsUtf8()}.png`",
 *       ["seedPrefix", "seedSuffix"]
 *    )
 *    getPath(): string {
 *       throw new Error("Should be replaced by expression")
 *    }
 * }
 * ```
 */
export function ExpressionMethod(
   expression: string,
   contextFields: string[] = [],
): MethodDecorator {
   return function <T>(
      target: object,
      propertyKey: string | symbol,
      _descriptor: TypedPropertyDescriptor<T>,
   ): void {
      const ctor = target.constructor as ContextPartConstructor

      // Initialize array if needed
      if (ctor[EXPRESSION_METHOD] == null) {
         Object.defineProperty(ctor, EXPRESSION_METHOD, {
            value: [],
            writable: false,
            enumerable: false,
            configurable: false,
         })
      }

      ;(ctor[EXPRESSION_METHOD] as ExpressionMethodMetadata[]).push({
         methodName: String(propertyKey),
         expression,
         contextFields,
      })
   }
}
