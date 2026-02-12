/* eslint-disable @typescript-eslint/no-dynamic-delete */
// import { BaseContextModel } from "./MiddlewareStep.js"
import { AssertEqual, AssertExtends } from "zod/v4/core/util.cjs"

type ReservedPropNames = "context" | "_context" | "_methods"

type OuterVisible<ContextBody extends object> = Omit<
   ContextBody,
   ReservedPropNames
>

type InnerState<Body extends object> = Omit<
   {
      [K in {
         [P in keyof Body]: Body[P] extends Function ? never : P
      }[keyof Body]]: Body[K]
   },
   ReservedPropNames
>

type InnerMethods<Body extends object> = Omit<
   {
      [K in {
         [P in keyof Body]: Body[P] extends Function ? P : never
      }[keyof Body]]: Body[K]
   },
   ReservedPropNames
>

export type MiddlewareContext<
   ContextBody extends object,
   DependencyBody extends object = object,
> =
   AssertDisjoint<ContextBody, DependencyBody> extends true
      ? OuterVisible<ContextBody> & {
           context: InnerState<ContextBody>
           _context: InnerState<DependencyBody>
           _methods: InnerMethods<ContextBody>
        }
      : never

export const METHODS: unique symbol = Symbol("Methods")

export type MiddlewareContextConstructor<
   ContextBody extends object,
   DependencyBody extends object = object,
> =
   AssertDisjoint<ContextBody, DependencyBody> extends true
      ? {
           new <
              CArgs extends readonly object[],
              DArgs extends readonly object[] = [],
           >(
              context: CombinesTo<InnerState<ContextBody>, CArgs>,
              ..._context: CombinesTo<InnerState<DependencyBody>, DArgs>
           ): MiddlewareContext<ContextBody, DependencyBody>
           [METHODS]: [keyof InnerMethods<ContextBody>]
        }
      : never

export function publicContextualize<K extends object>(
   obj: K | (new (...args: any[]) => K),
): MiddlewareContextConstructor<K, {}> {
   let sample = obj
   if (typeof obj === "function") {
      const Obj = obj
      sample = new Obj()
   }
   const propNames: Array<keyof K> = Object.getOwnPropertyNames(
      sample,
   ) as Array<keyof K>
   const methodNames: Array<keyof K> = Object.entries(
      Object.getOwnPropertyDescriptors(sample.constructor.prototype),
   ).map(
      ([methodName, _descriptor]: [string, any]): keyof K =>
         methodName as keyof K,
   )
   const RetVal = class RetVal<CArgs extends readonly object[]> {
      private readonly context: InnerState<K>
      private readonly _context: object
      private readonly _methods: InnerMethods<K>
      static readonly [METHODS]: Array<keyof K> = [...methodNames]

      constructor(context: CombinesTo<K, CArgs>) {
         this.context = Object.assign({}, ...context)
         this._context = {}
         this._methods = Object.fromEntries(
            methodNames.map((methodName: keyof K) => {
               return [
                  methodName,
                  (...args: any[]) => {
                     return (this as any)[methodName].call(...args)
                  },
               ]
            }),
         ) as InnerMethods<K>
      }
   }

   for (const propName of propNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get: function () {
            return this.context[propName]
         },
         configurable: false,
         enumerable: false,
      })
   }
   Object.defineProperties(
      RetVal.prototype,
      Object.getOwnPropertyDescriptors(sample.constructor.prototype),
   )

   return RetVal as unknown as MiddlewareContextConstructor<K, {}>
}

export function privateContextualize<K extends object>(
   obj: K | (new (...args: any[]) => K),
): MiddlewareContextConstructor<{}, K> {
   let sample = obj
   if (typeof obj === "function") {
      const Obj = obj
      sample = new Obj()
   }
   const propNames: Array<keyof K> = Object.getOwnPropertyNames(
      sample,
   ) as Array<keyof K>
   const RetVal = class RetVal<
      CArgs extends readonly object[],
      DArgs extends readonly object[],
   > {
      private readonly context: object
      private readonly _context: InnerState<K>
      private readonly _methods: InnerMethods<object>
      static readonly [METHODS]: Array<keyof object> = []

      constructor(
         _context: CombinesTo<object, CArgs>,
         ...context: CombinesTo<InnerState<K>, DArgs>
      ) {
         this.context = {}
         this._context = Object.assign({}, ...context)
         this._methods = {}
      }
   }

   for (const propName of propNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get: function () {
            return this.context[propName]
         },
         configurable: false,
         enumerable: false,
      })
   }
   Object.defineProperties(
      RetVal.prototype,
      Object.getOwnPropertyDescriptors(sample.constructor.prototype),
   )

   return RetVal as unknown as MiddlewareContextConstructor<object, K>
}

export function mergeConstructors<
   A extends object,
   B extends object,
   C extends object = object,
   D extends object = object,
>(
   agg: MiddlewareContextConstructor<A, C>,
   next: MiddlewareContextConstructor<B, D>,
): MiddlewareContextConstructor<MergePair<A, B>, MergePair<C, D>> {
   const RetVal = class<CArgs extends object[], DArgs extends object[]> {
      private readonly context: InnerState<MergePair<A, B>>
      private readonly _context: InnerState<MergePair<C, D>>
      private readonly _methods: InnerMethods<MergePair<A, B>>
      static readonly [METHODS] = [...agg[METHODS], ...next[METHODS]]

      constructor(
         context: CombinesTo<InnerState<MergePair<A, B>>, CArgs>,
         ..._context: CombinesTo<InnerState<MergePair<C, D>>, DArgs>
      ) {
         this.context = Object.assign({}, ...context)
         this._context = Object.assign({}, ..._context)
         this._methods = Object.fromEntries(
            RetVal[METHODS].map((methodName: keyof A | keyof B) => {
               return [
                  methodName,
                  (...args: any[]) => {
                     return (this as any)[methodName].call(...args)
                  },
               ]
            }),
         ) as InnerMethods<MergePair<A, B>>
      }
   }

   const aggProps = Object.getOwnPropertyDescriptors(agg.prototype)
   const nextProps = Object.getOwnPropertyDescriptors(next.prototype)
   const mergeProps = Object.fromEntries(
      Object.entries(aggProps).concat(Object.entries(nextProps)),
   )
   // eslint-disable-next-line @typescript-eslint/dot-notation
   delete mergeProps["constructor"]
   Object.defineProperties(RetVal.prototype, mergeProps)

   return RetVal as unknown as MiddlewareContextConstructor<
      MergePair<A, B>,
      MergePair<C, D>
   >
}

export function mergeContexts<
   A extends object,
   B extends object,
   C extends object = object,
   D extends object = object,
>(
   agg: MiddlewareContext<A, C>,
   next: MiddlewareContext<B, D>,
): MiddlewareContext<MergePair<A, B>, MergePair<C, D>> {
   const RetVal: MiddlewareContextConstructor<
      MergePair<A, B>,
      MergePair<C, D>
   > = mergeConstructors(
      agg.constructor as MiddlewareContextConstructor<A, C>,
      next.constructor as MiddlewareContextConstructor<B, D>,
   )

   return new RetVal(
      [agg.context, next.context] as [A, B],
      agg._context as C,
      next._context as D,
   )
}

type MergePair<A extends object, B extends object> = {
   [K in keyof A | keyof B]: K extends keyof B
      ? B[K]
      : K extends keyof A
        ? A[K]
        : never
}

type CombineAll<objects extends readonly object[]> = objects extends [
   infer First extends object,
   ...infer Rest extends readonly object[],
]
   ? MergePair<First, CombineAll<Rest>>
   : {}

export type CombinesTo<Goal extends object, Args extends readonly object[]> =
   AssertEqual<
      CombineAll<Args>,
      AssertExtends<CombineAll<Args>, Goal>
   > extends true
      ? Args
      : never

export type AssertDisjoint<A extends object, B extends object> =
   AssertEqual<keyof A & keyof B, never> extends true ? false : true

export type BIfDisjoint<A extends object, B extends object> =
   AssertDisjoint<A, B> extends true ? B : never

export type AAndBIfDisjointElseA<A extends object, B extends object> =
   AssertDisjoint<A, B> extends true ? A & B : A

// =============================================================================
// Activity Contextualization
// =============================================================================

/**
 * Symbol for storing action annotations on methods.
 * Consumer-specific annotations (e.g., GatheringWorkerAction) store metadata here.
 */
export const ACTION_METADATA: unique symbol = Symbol("ActionMetadata")

/**
 * Base interface for action annotations.
 * Each consumer (GatheringWorker, ProjectCompletionWorker, etc.) extends this
 * with a unique discriminator.
 */
export interface ActionMetadata {
   /** Discriminator identifying which consumer should invoke this action */
   readonly consumer: string | symbol
   /** Execution priority within that consumer's action set (lower = earlier) */
   readonly priority: number
}

/**
 * Stored metadata for annotated methods on an Activity class
 */
interface MethodActionEntry {
   methodName: string
   metadata: ActionMetadata
}

/**
 * Symbol for storing the list of action entries on an Activity class
 */
export const ACTION_ENTRIES: unique symbol = Symbol("ActionEntries")

/**
 * Factory to create consumer-specific action decorators.
 *
 * @param consumer - Unique discriminator for the consumer (e.g., "gathering-worker")
 * @returns A decorator factory that accepts priority and other options
 *
 * @example
 * // In the GatheringWorker module:
 * export const GatheringWorkerAction = createActionDecorator("gathering-worker")
 *
 * // In an Activity class:
 * class ImageStagingActivity {
 *    @GatheringWorkerAction({ priority: 10 })
 *    async stage(imageBuffer: Buffer): Promise<StagedResult> { ... }
 * }
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
         const ctor = target.constructor as {
            [ACTION_ENTRIES]?: MethodActionEntry[]
         }
         if (ctor[ACTION_ENTRIES] == null) {
            ctor[ACTION_ENTRIES] = []
         }
         ctor[ACTION_ENTRIES].push({
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
   ctor: { [ACTION_ENTRIES]?: MethodActionEntry[] },
   consumer: string | symbol,
): MethodActionEntry[] {
   const entries = ctor[ACTION_ENTRIES] ?? []
   return entries
      .filter((entry) => entry.metadata.consumer === consumer)
      .sort((a, b) => a.metadata.priority - b.metadata.priority)
}

/**
 * Marker interface for Activity classes.
 * Activities have:
 * - PublicState: properties exposed in `context`
 * - Dependencies: properties stored in `_context`
 * - Methods: callable via `_methods`
 */
export interface ActivityClass<
   PublicState extends object,
   Dependencies extends object,
> {
   new (dependencies: Dependencies): PublicState
   [ACTION_ENTRIES]?: MethodActionEntry[]
}

/**
 * Contextualizes an Activity class that has both public state and private dependencies.
 *
 * The Activity class should:
 * - Accept dependencies in its constructor
 * - Have public properties for state
 * - Have methods annotated with consumer-specific decorators
 *
 * @param activityClass - The Activity class to contextualize
 * @param dependencyKeys - Keys that identify which properties are dependencies
 *
 * @example
 * class ImageStagingActivity {
 *    stagedPath?: string  // public state
 *
 *    constructor(
 *       private readonly fileStore: IFileStore,
 *       private readonly pathNaming: IPathNaming,
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
 *    ["fileStore", "pathNaming"]
 * )
 */
export function activityContextualize<
   PublicState extends object,
   Dependencies extends object,
>(
   activityClass: new (deps: Dependencies) => PublicState,
   dependencyKeys: Array<keyof Dependencies>,
): MiddlewareContextConstructor<
   PublicState & InnerMethods<PublicState>,
   Dependencies
> {
   // Create a sample instance to inspect structure
   // (Activity classes should handle undefined deps gracefully for introspection)
   // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
   const sampleDeps: Dependencies = {} as Dependencies
   let sample: PublicState
   try {
      const ActivityClass = activityClass
      sample = new ActivityClass(sampleDeps)
   } catch {
      // If constructor fails, create empty sample
      sample = Object.create(activityClass.prototype) as PublicState
   }

   // Identify public properties (non-function, non-dependency)
   const allPropNames = Object.getOwnPropertyNames(sample) as Array<
      keyof PublicState
   >
   const depKeySet = new Set(dependencyKeys as string[])
   const publicPropNames = allPropNames.filter(
      (name) =>
         !depKeySet.has(name as string) &&
         typeof (sample as Record<string, unknown>)[name as string] !==
            "function",
   )

   // Identify methods from prototype (excluding constructor)
   const methodDescriptors = Object.getOwnPropertyDescriptors(
      activityClass.prototype,
   )
   const methodNames = Object.keys(methodDescriptors).filter(
      (name) =>
         name !== "constructor" &&
         typeof methodDescriptors[name].value === "function",
   )

   // Get action entries if any
   const actionEntries =
      (activityClass as unknown as { [ACTION_ENTRIES]?: MethodActionEntry[] })[
         ACTION_ENTRIES
      ] ?? []

   const RetVal = class<
      CArgs extends readonly object[],
      DArgs extends readonly object[],
   > {
      private readonly context: InnerState<PublicState>
      private readonly _context: InnerState<Dependencies>
      private readonly _methods: InnerMethods<PublicState>
      static readonly [METHODS] = [...methodNames] as Array<keyof PublicState>
      static readonly [ACTION_ENTRIES] = actionEntries

      constructor(
         contextArgs: CombinesTo<InnerState<PublicState>, CArgs>,
         ...depArgs: CombinesTo<InnerState<Dependencies>, DArgs>
      ) {
         // Merge public state from context args
         this.context = Object.assign(
            {},
            ...contextArgs,
         ) as InnerState<PublicState>
         // Merge dependencies from dep args
         this._context = Object.assign(
            {},
            ...depArgs,
         ) as InnerState<Dependencies>
         // Build _methods with bound references
         this._methods = Object.fromEntries(
            methodNames.map((methodName) => {
               return [
                  methodName,
                  (...args: unknown[]) => {
                     return (this as unknown as Record<string, Function>)[
                        methodName
                     ](...args)
                  },
               ]
            }),
         ) as InnerMethods<PublicState>
      }
   }

   // Define getters for public properties that delegate to context
   for (const propName of publicPropNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get: function (this: { context: Record<string, unknown> }) {
            return this.context[propName as string]
         },
         set: function (
            this: { context: Record<string, unknown> },
            value: unknown,
         ) {
            this.context[propName as string] = value
         },
         configurable: false,
         enumerable: true,
      })
   }

   // Define getters for dependencies that delegate to _context
   for (const depKey of dependencyKeys) {
      Object.defineProperty(RetVal.prototype, depKey, {
         get: function (this: { _context: Record<string, unknown> }) {
            return this._context[depKey as string]
         },
         configurable: false,
         enumerable: false,
      })
   }

   // Copy method implementations from activity prototype
   for (const methodName of methodNames) {
      Object.defineProperty(
         RetVal.prototype,
         methodName,
         methodDescriptors[methodName],
      )
   }

   return RetVal as unknown as MiddlewareContextConstructor<
      PublicState & InnerMethods<PublicState>,
      Dependencies
   >
}

// export type MiddlewareContextConstructor<
//    Input extends RawTaskDto,
//    GivenContext extends BaseContextModel,
//    GivenAdapter extends MiddlewareContext<GivenContext>,
//    ProvidedContext extends object,
// > = new (
//    taskId: PaintTaskId,
//    dto: Input,
//    given: MiddlewareContext<GivenContext>,
// ) => MiddlewareContext<ProvidedContext>

// export interface IMiddlewareStep<
//    RequiredInput extends RawTaskDto = RawTaskDto,
//    RequiredContext extends object = IBaseContextModel,
//    ProvidedContext extends object = never,
// > {
//    extendContext: ProvidedContext extends object
//       ? <
//            CurrentInput extends RequiredInput,
//            CurrentContext extends RequiredContext,
//         >(
//            base: MiddlewareContextConstructor<CurrentInput, CurrentContext>,
//         ) => MiddlewareContextConstructor<
//            CurrentInput,
//            Extend<ProvidedContext, CurrentContext>
//         >
//       : never
//    handleStep: <
//       CurrentContext extends Extend<ProvidedContext & {}, RequiredContext>,
//    >(
//       input: CurrentContext,
//    ) => CurrentContext
// }
// export interface IMiddlewareChainBuilder<
//    Input extends RawTaskDto,
//    CurrentContext extends IBaseContextModel,
// > {}

// export class MiddlewareChainBuilder<
//    Input extends RawTaskDto,
//    CurrentContext extends IBaseContextModel,
// > implements IMiddlewareChainBuilder<Input, CurrentContext> {}
