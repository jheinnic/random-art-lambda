/**
 * Contextualize Helpers
 *
 * Functions that transform regular classes into MiddlewareContextConstructors
 * suitable for composition into the accumulated context object.
 *
 * Design patterns:
 * - publicContextualize(): Properties → context, methods → _methods
 * - privateContextualize(): Properties → _context (dependencies)
 * - activityContextualize(): Split public/private, then merge
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
   METHODS,
   ACTION_ENTRIES,
   CONTEXT_PART_METADATA,
   DELEGATED_INJECT,
   EXPRESSION_METHOD,
   type ContextPartMetadata,
   type ContextPartOptions,
   type ContextPartConstructor,
   type MethodActionEntry,
   type DelegatedInjectMetadata,
   type ExpressionMethodMetadata,
   getContextPartMetadata,
} from "./ContextPartMetadata.js"
import {
   registerContextPart,
   globalContextPartRegistry,
} from "./ContextPartRegistry.js"

// ============================================================================
// Type Utilities (from extTwo)
// ============================================================================

type ReservedPropNames = "context" | "_context" | "_methods"

/**
 * Filter to non-function properties, excluding reserved names
 */
type InnerState<Body extends object> = Omit<
   {
      [K in {
         [P in keyof Body]: Body[P] extends Function ? never : P
      }[keyof Body]]: Body[K]
   },
   ReservedPropNames
>

/**
 * Filter to function properties only, excluding reserved names
 */
type InnerMethods<Body extends object> = Omit<
   {
      [K in {
         [P in keyof Body]: Body[P] extends Function ? P : never
      }[keyof Body]]: Body[K]
   },
   ReservedPropNames
>

// ============================================================================
// MiddlewareContext Types
// ============================================================================

/**
 * The shape of a contextualized object instance.
 *
 * @typeParam ContextBody - Public state type
 * @typeParam DependencyBody - Private dependency type
 */
export type MiddlewareContext<
   ContextBody extends object,
   DependencyBody extends object = object,
> = {
   /** Public state - accessible in expressions */
   readonly context: InnerState<ContextBody>
   /** Private dependencies - not exposed in expressions */
   readonly _context: InnerState<DependencyBody>
   /** Method references - accessible in expressions */
   readonly _methods: InnerMethods<ContextBody>
} & InnerState<ContextBody> // Properties also at top level via getters

/**
 * Constructor for a MiddlewareContext
 */
export interface MiddlewareContextConstructor<
   ContextBody extends object,
   DependencyBody extends object = object,
> {
   new (
      contextArgs: object[],
      ...depArgs: object[]
   ): MiddlewareContext<ContextBody, DependencyBody>
   readonly [METHODS]: string[]
   readonly [ACTION_ENTRIES]?: MethodActionEntry[]
   readonly [CONTEXT_PART_METADATA]?: ContextPartMetadata
   readonly [DELEGATED_INJECT]?: DelegatedInjectMetadata[]
   readonly [EXPRESSION_METHOD]?: ExpressionMethodMetadata[]
}

// ============================================================================
// publicContextualize
// ============================================================================

/**
 * Contextualizes a class with all public properties and methods.
 *
 * The class's:
 * - Properties → `context` (public state, accessible in expressions)
 * - Methods → `_methods` (callable in expressions)
 *
 * @param sourceClass - Class or object to contextualize
 * @param options - Optional @ContextPart metadata to apply
 *
 * @example
 * ```typescript
 * class BaseTaskModel {
 *    constructor(
 *       public readonly taskId: string,
 *       public readonly seedPrefix: string,
 *       public readonly seedSuffix: string,
 *    ) {}
 * }
 *
 * const BaseTaskContext = publicContextualize(BaseTaskModel, {
 *    name: "BaseTaskModel",
 *    visibility: "public",
 * })
 * ```
 */
export function publicContextualize<K extends object>(
   sourceClass: K | (new (...args: any[]) => K),
   options?: ContextPartOptions,
): MiddlewareContextConstructor<K, object> {
   // Get sample to inspect structure
   let sample: K
   if (typeof sourceClass === "function") {
      try {
         sample = new (sourceClass as new () => K)()
      } catch {
         sample = Object.create(
            (sourceClass as new () => K).prototype,
         ) as K
      }
   } else {
      sample = sourceClass
   }

   // Identify properties (non-function)
   const propNames = Object.getOwnPropertyNames(sample).filter(
      (name) =>
         !["context", "_context", "_methods"].includes(name) &&
         typeof (sample as Record<string, unknown>)[name] !== "function",
   ) as Array<keyof K>

   // Identify methods from prototype
   const proto =
      typeof sourceClass === "function"
         ? sourceClass.prototype
         : Object.getPrototypeOf(sample)
   const methodDescriptors = Object.getOwnPropertyDescriptors(proto)
   const methodNames = Object.keys(methodDescriptors).filter(
      (name) =>
         name !== "constructor" &&
         typeof methodDescriptors[name].value === "function",
   )

   // Build the contextualized class
   const RetVal = class {
      readonly context: InnerState<K>
      readonly _context: object
      readonly _methods: InnerMethods<K>
      static readonly [METHODS]: string[] = [...methodNames]

      constructor(contextArgs: object[]) {
         this.context = Object.assign({}, ...contextArgs) as InnerState<K>
         this._context = {}
         this._methods = Object.fromEntries(
            methodNames.map((methodName) => [
               methodName,
               (...args: unknown[]) =>
                  (this as unknown as Record<string, Function>)[methodName](
                     ...args,
                  ),
            ]),
         ) as InnerMethods<K>
      }
   }

   // Add property getters
   for (const propName of propNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get(this: { context: Record<string, unknown> }) {
            return this.context[propName as string]
         },
         set(this: { context: Record<string, unknown> }, value: unknown) {
            this.context[propName as string] = value
         },
         configurable: false,
         enumerable: true,
      })
   }

   // Copy method implementations
   for (const methodName of methodNames) {
      Object.defineProperty(RetVal.prototype, methodName, methodDescriptors[methodName])
   }

   // Apply @ContextPart metadata if provided
   if (options != null) {
      applyContextPartMetadata(RetVal as unknown as ContextPartConstructor, {
         ...options,
         visibility: options.visibility ?? "public",
      })
   }

   return RetVal as unknown as MiddlewareContextConstructor<K, object>
}

// ============================================================================
// privateContextualize
// ============================================================================

/**
 * Contextualizes a class with all private dependencies.
 *
 * The class's:
 * - Properties → `_context` (private dependencies, not in expressions)
 * - No methods exposed
 *
 * @param sourceClass - Class or object to contextualize
 * @param options - Optional @ContextPart metadata to apply
 *
 * @example
 * ```typescript
 * abstract class HasFileStore {
 *    constructor(public readonly fileStore: IFileStore) {}
 * }
 *
 * const FileStoreDependency = privateContextualize(HasFileStore, {
 *    name: "HasFileStore",
 *    isAbstract: true,
 *    visibility: "private",
 * })
 * ```
 */
export function privateContextualize<K extends object>(
   sourceClass: K | (new (...args: any[]) => K),
   options?: ContextPartOptions,
): MiddlewareContextConstructor<object, K> {
   // Get sample to inspect structure
   let sample: K
   if (typeof sourceClass === "function") {
      try {
         sample = new (sourceClass as new () => K)()
      } catch {
         sample = Object.create(
            (sourceClass as new () => K).prototype,
         ) as K
      }
   } else {
      sample = sourceClass
   }

   // Identify properties
   const propNames = Object.getOwnPropertyNames(sample).filter(
      (name) => !["context", "_context", "_methods"].includes(name),
   ) as Array<keyof K>

   // Build the contextualized class
   const RetVal = class {
      readonly context: object
      readonly _context: InnerState<K>
      readonly _methods: object
      static readonly [METHODS]: string[] = []

      constructor(_contextArgs: object[], ...depArgs: object[]) {
         this.context = {}
         this._context = Object.assign({}, ...depArgs) as InnerState<K>
         this._methods = {}
      }
   }

   // Add property getters (delegating to _context)
   for (const propName of propNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get(this: { _context: Record<string, unknown> }) {
            return this._context[propName as string]
         },
         configurable: false,
         enumerable: false,
      })
   }

   // Apply @ContextPart metadata if provided
   if (options != null) {
      applyContextPartMetadata(RetVal as unknown as ContextPartConstructor, {
         ...options,
         visibility: options.visibility ?? "private",
      })
   }

   return RetVal as unknown as MiddlewareContextConstructor<object, K>
}

// ============================================================================
// activityContextualize
// ============================================================================

/**
 * Contextualizes an Activity class that has both public state and private dependencies.
 *
 * This uses the split-then-merge approach:
 * 1. Extract and contextualize public properties → PublicPart
 * 2. Extract and contextualize private dependencies → PrivatePart
 * 3. Merge the two parts
 * 4. Attach methods from the original class
 *
 * @param activityClass - The Activity class to contextualize
 * @param publicKeys - Keys that become public state (in context)
 * @param privateKeys - Keys that become private dependencies (in _context)
 * @param options - Optional @ContextPart metadata to apply
 *
 * @example
 * ```typescript
 * class ImageStagingActivity {
 *    stagedPath?: string  // public state
 *
 *    constructor(
 *       private readonly fileStore: IFileStore,    // dependency
 *       private readonly pathNaming: IPathNaming,  // dependency
 *    ) {}
 *
 *    @GatheringWorkerAction({ priority: 10 })
 *    async stage(imageBuffer: Buffer): Promise<StagedResult> {
 *       const path = this.pathNaming.getPath()
 *       await this.fileStore.write(path, imageBuffer)
 *       this.stagedPath = path
 *       return { path }
 *    }
 * }
 *
 * const StagingActivityContext = activityContextualize(
 *    ImageStagingActivity,
 *    ["stagedPath"],        // public keys
 *    ["fileStore", "pathNaming"],  // private keys
 *    {
 *       name: "ImageStagingActivity",
 *       dependsOn: [HasFileStore, HasPathNaming],
 *    }
 * )
 * ```
 */
export function activityContextualize<
   PublicState extends object,
   Dependencies extends object,
>(
   activityClass: new (...args: any[]) => PublicState & Dependencies,
   publicKeys: Array<keyof PublicState>,
   privateKeys: Array<keyof Dependencies>,
   options?: ContextPartOptions,
): MiddlewareContextConstructor<PublicState, Dependencies> {
   // Get sample to inspect structure
   let sample: PublicState & Dependencies
   try {
      sample = new activityClass({} as any)
   } catch {
      sample = Object.create(activityClass.prototype) as PublicState &
         Dependencies
   }

   // Convert key arrays to sets for fast lookup
   const publicKeySet = new Set(publicKeys as string[])
   const privateKeySet = new Set(privateKeys as string[])

   // Identify all properties
   const allPropNames = Object.getOwnPropertyNames(sample).filter(
      (name) => !["context", "_context", "_methods"].includes(name),
   )

   // Split into public and private
   const publicPropNames = allPropNames.filter(
      (name) =>
         publicKeySet.has(name) &&
         typeof (sample as Record<string, unknown>)[name] !== "function",
   )
   const privatePropNames = allPropNames.filter(
      (name) =>
         privateKeySet.has(name) &&
         typeof (sample as Record<string, unknown>)[name] !== "function",
   )

   // Identify methods from prototype
   const methodDescriptors = Object.getOwnPropertyDescriptors(
      activityClass.prototype,
   )
   const methodNames = Object.keys(methodDescriptors).filter(
      (name) =>
         name !== "constructor" &&
         typeof methodDescriptors[name].value === "function",
   )

   // Get action entries from the original class
   const actionEntries =
      (activityClass as unknown as ContextPartConstructor)[ACTION_ENTRIES] ?? []

   // Get delegated inject metadata
   const delegatedInjects =
      (activityClass as unknown as ContextPartConstructor)[DELEGATED_INJECT] ??
      []

   // Get expression method metadata
   const expressionMethods =
      (activityClass as unknown as ContextPartConstructor)[EXPRESSION_METHOD] ??
      []

   // Build the merged contextualized class
   const RetVal = class {
      readonly context: InnerState<PublicState>
      readonly _context: InnerState<Dependencies>
      readonly _methods: InnerMethods<PublicState>
      static readonly [METHODS]: string[] = [...methodNames]
      static readonly [ACTION_ENTRIES]: MethodActionEntry[] = actionEntries
      static readonly [DELEGATED_INJECT]: DelegatedInjectMetadata[] =
         delegatedInjects
      static readonly [EXPRESSION_METHOD]: ExpressionMethodMetadata[] =
         expressionMethods

      constructor(contextArgs: object[], ...depArgs: object[]) {
         this.context = Object.assign(
            {},
            ...contextArgs,
         ) as InnerState<PublicState>
         this._context = Object.assign(
            {},
            ...depArgs,
         ) as InnerState<Dependencies>
         this._methods = Object.fromEntries(
            methodNames.map((methodName) => [
               methodName,
               (...args: unknown[]) =>
                  (this as unknown as Record<string, Function>)[methodName](
                     ...args,
                  ),
            ]),
         ) as InnerMethods<PublicState>
      }
   }

   // Add public property getters (delegating to context)
   for (const propName of publicPropNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get(this: { context: Record<string, unknown> }) {
            return this.context[propName]
         },
         set(this: { context: Record<string, unknown> }, value: unknown) {
            this.context[propName] = value
         },
         configurable: false,
         enumerable: true,
      })
   }

   // Add private property getters (delegating to _context)
   for (const propName of privatePropNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get(this: { _context: Record<string, unknown> }) {
            return this._context[propName]
         },
         configurable: false,
         enumerable: false,
      })
   }

   // Copy method implementations
   for (const methodName of methodNames) {
      Object.defineProperty(
         RetVal.prototype,
         methodName,
         methodDescriptors[methodName],
      )
   }

   // Apply @ContextPart metadata if provided
   if (options != null) {
      applyContextPartMetadata(RetVal as unknown as ContextPartConstructor, options)
   }

   return RetVal as unknown as MiddlewareContextConstructor<
      PublicState,
      Dependencies
   >
}

// ============================================================================
// Merge Utilities
// ============================================================================

/**
 * Merge two MiddlewareContextConstructors into one.
 *
 * The resulting constructor:
 * - Has combined context from both
 * - Has combined _context from both
 * - Has combined _methods from both
 */
export function mergeConstructors<
   A extends object,
   B extends object,
   C extends object = object,
   D extends object = object,
>(
   first: MiddlewareContextConstructor<A, C>,
   second: MiddlewareContextConstructor<B, D>,
): MiddlewareContextConstructor<A & B, C & D> {
   const combinedMethods = [...first[METHODS], ...second[METHODS]]
   const combinedActions = [
      ...(first[ACTION_ENTRIES] ?? []),
      ...(second[ACTION_ENTRIES] ?? []),
   ]
   const combinedInjects = [
      ...(first[DELEGATED_INJECT] ?? []),
      ...(second[DELEGATED_INJECT] ?? []),
   ]
   const combinedExpressions = [
      ...(first[EXPRESSION_METHOD] ?? []),
      ...(second[EXPRESSION_METHOD] ?? []),
   ]

   const RetVal = class {
      readonly context: InnerState<A & B>
      readonly _context: InnerState<C & D>
      readonly _methods: InnerMethods<A & B>
      static readonly [METHODS]: string[] = combinedMethods
      static readonly [ACTION_ENTRIES]: MethodActionEntry[] = combinedActions
      static readonly [DELEGATED_INJECT]: DelegatedInjectMetadata[] =
         combinedInjects
      static readonly [EXPRESSION_METHOD]: ExpressionMethodMetadata[] =
         combinedExpressions

      constructor(contextArgs: object[], ...depArgs: object[]) {
         this.context = Object.assign(
            {},
            ...contextArgs,
         ) as InnerState<A & B>
         this._context = Object.assign({}, ...depArgs) as InnerState<C & D>
         this._methods = Object.fromEntries(
            combinedMethods.map((methodName) => [
               methodName,
               (...args: unknown[]) =>
                  (this as unknown as Record<string, Function>)[methodName](
                     ...args,
                  ),
            ]),
         ) as InnerMethods<A & B>
      }
   }

   // Copy property descriptors from both prototypes
   const firstProps = Object.getOwnPropertyDescriptors(first.prototype)
   const secondProps = Object.getOwnPropertyDescriptors(second.prototype)
   const mergedProps: Record<string, PropertyDescriptor> = { ...firstProps, ...secondProps }
   delete mergedProps["constructor"]
   Object.defineProperties(RetVal.prototype, mergedProps)

   return RetVal as unknown as MiddlewareContextConstructor<A & B, C & D>
}

// ============================================================================
// Helper: Apply Metadata
// ============================================================================

/**
 * Programmatically apply @ContextPart metadata to a dynamically generated class.
 * Since decorators can't be applied to dynamic classes, we call the decorator logic directly.
 */
export function applyContextPartMetadata(
   target: ContextPartConstructor,
   options: ContextPartOptions,
): void {
   const name = options.name ?? target.name

   // Convert provides/dependsOn arrays to ContextPartRef arrays
   const provides = (options.provides ?? []).map((partClass) => ({
      partClass,
      name: getContextPartMetadata(partClass)?.name ?? partClass.name,
   }))

   const dependsOn = (options.dependsOn ?? []).map((partClass) => ({
      partClass,
      name: getContextPartMetadata(partClass)?.name ?? partClass.name,
   }))

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

   // Register with global registry if not abstract
   if (!metadata.isAbstract) {
      registerContextPart(target)
   }
}
