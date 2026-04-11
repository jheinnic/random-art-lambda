/* eslint-disable no-template-curly-in-string */
import jseEval, { compile } from "jse-eval"
import templatePlugin from "@jsep-plugin/template"

// Register template-literal syntax support once for this module.
jseEval.registerPlugin(templatePlugin)

/**
 * HypoV3.ts — Pipeline Builder with Virtual Feature Support
 *
 * Evolution from HypoV2B.ts. Key additions:
 *
 * - `VirtualContext` as 5th type parameter tracking declared-but-unbound contracts
 * - `addVirtualFeature`: reserves a namespace + type contract without adding to StepContext
 * - `addStep` / `addInjection` nameOut must be unused in BOTH StepContext AND VirtualContext
 * - Feature `properties` restricted to `string | [string]` when fulfilling a virtual contract
 * - Step and `buildPipeline` selectors are typed against `StepContext | VirtualContext`
 * - `buildPipeline` returns `Promise<Partial<ResultOut>>` — pruning makes some keys absent
 * - Runtime pruning cascade:
 *     unfulfilled virtual → step referencing it is skipped
 *     → result property referencing that step's output is omitted
 */

// =============================================================================
// Type Utilities
// =============================================================================

/** Candidate is the literal type only if it is not already a key of Context. */
type UnusedKey<
   Context extends object,
   Candidate extends string,
> = Candidate extends keyof Context ? never : Candidate

/** Candidate only if the two objects share no keys. */
type CompatibleForMixin<Context extends object, Candidate extends object> = [
   keyof Context & keyof Candidate,
] extends [never]
   ? Candidate
   : never

/** Non-overlapping merge of two object types; never if they share a key. */
type Mixin<Context extends object, Candidate extends object> = [
   keyof Context & keyof Candidate,
] extends [never]
   ? {
        [K in keyof Context | keyof Candidate]: K extends keyof Context
           ? Context[K]
           : K extends keyof Candidate
             ? Candidate[K]
             : never
     }
   : never

/** Add a single new property to an object type; never if the key is taken. */
type WithProp<Context extends object, NewKey extends string, NewValue> =
   NewKey extends UnusedKey<Context, NewKey>
      ? {
           [K in NewKey | keyof Context]: K extends keyof Context
              ? Context[K]
              : NewValue
        }
      : never

/** Union of all [K, P] two-level path tuples reachable from Context. */
type ContextKeyPairs<Context extends object> = {
   [K in keyof Context]: [K, keyof Context[K]]
}[keyof Context]

/** Union of all valid single-key or two-level path selectors for Context. */
type ContextKeysAndPairs<Context extends object> = {
   [K in keyof Context]: K | [K, keyof Context[K]]
}[keyof Context]

/** Selectors valid against either the concrete StepContext or VirtualContext. */
// type AnySelector<StepCtx extends object, VirtualCtx extends object> =
//    | ContextKeysAndPairs<StepCtx>
//    | ContextKeysAndPairs<VirtualCtx>

/** Resolve a single selector to its value type, checking StepCtx then VirtualCtx. */
// type ResolveSelector<
//    StepCtx extends object,
//    VirtualCtx extends object,
//    Sel,
// > = Sel extends keyof StepCtx
//    ? StepCtx[Sel]
//    : Sel extends keyof VirtualCtx
//      ? VirtualCtx[Sel]
//      : Sel extends readonly [
//             infer K extends keyof StepCtx,
//             infer P extends keyof StepCtx[K],
//          ]
//        ? StepCtx[K][P]
//        : Sel extends readonly [
//               infer K extends keyof VirtualCtx,
//               infer P extends keyof VirtualCtx[K],
//            ]
//          ? VirtualCtx[K][P]
//          : never

/** Map an array of selectors to the tuple of value types they resolve to. */
// type CallableParams<
//    StepCtx extends object,
//    VirtualCtx extends object,
//    ParamSelectors extends ReadonlyArray<AnySelector<StepCtx, VirtualCtx>>,
// > = {
//    [N in keyof ParamSelectors]: ResolveSelector<
//       StepCtx,
//       VirtualCtx,
//       ParamSelectors[N]
//    >
// }

type CallableParams<
   Context extends object,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> = {
   [N in keyof ParamSelectors]: ParamSelectors[N] extends keyof Context
      ? Context[ParamSelectors[N]]
      : ParamSelectors[N] extends ContextKeyPairs<Context>
        ? Context[ParamSelectors[N][0]][ParamSelectors[N][1]]
        : never
}

// =============================================================================
// ContextualMethod
// =============================================================================

/**
 * A typed method bound to selected context values.
 * Selectors can address StepContext (concrete) or VirtualContext (declared contract).
 * The method's parameter types are inferred from the selectors.
 */
// export interface ContextualMethod<
//    StepCtx extends object,
//    VirtualCtx extends object,
//    ReturnedType,
//    ParamSelectors extends ReadonlyArray<AnySelector<StepCtx, VirtualCtx>>,
// > {
//    method: (
//       ...args: CallableParams<StepCtx, VirtualCtx, ParamSelectors>
//    ) => ReturnedType | Promise<ReturnedType>
//    selectors: ParamSelectors
// }

export interface ContextualMethod<
   Context extends object,
   ReturnedType,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> {
   method: (
      ...args: CallableParams<Context, ParamSelectors>
   ) => ReturnedType | Promise<ReturnedType>
   selectors: ParamSelectors
}

// =============================================================================
// Feature Property Types
// =============================================================================

/**
 * Maps each feature property key to its own selector tuple.
 *
 * By providing a per-key mapping rather than a shared union, TypeScript can
 * resolve the exact selector tuple for each property independently, allowing
 * it to check the corresponding method's parameter types against the correct
 * context values — no shared union needed.
 */
type PropertySelectorsMap<Context extends object, Props> = {
   [K in keyof Props]?: ReadonlyArray<ContextKeysAndPairs<Context>>
}

/**
 * Feature properties where every property with a ContextualMethod must have
 * its selector tuple declared in SelectorsMap.
 *
 * For each key K:
 * - If `K ∈ SelectorsMap`: the ContextualMethod is constrained to `SelectorsMap[K]`,
 *   so TypeScript checks the method's parameter types against the resolved context values.
 * - If `K ∉ SelectorsMap`: only `string` or `readonly [string]` (expression forms) are
 *   accepted. A ContextualMethod is not permitted because its selector→parameter
 *   alignment cannot be verified — the framework resolves selector values and passes them
 *   as positional arguments, so an unchecked method would silently receive wrong types.
 *
 * To use a ContextualMethod for property K, add K to the Sel type argument or construct
 * the value with `cm<AllContext>()` — TypeScript can infer Sel from the selectors field.
 */
type FeatureProperties<
   Context extends object,
   Props,
   SelectorsMap extends PropertySelectorsMap<Context, Props>,
> = {
   [K in keyof Props]:
      | string // developer-config expression: full StepContext access
      | readonly [string] // two-stage: outer expr (StepContext) → inner (ExprContext sandbox)
      | (K extends keyof SelectorsMap
           ? ContextualMethod<Context, Props[K], NonNullable<SelectorsMap[K]>>
           : never)
}

/**
 * Property map when a feature call fulfills a virtual contract.
 * Restricted to expression strings only — no ContextualMethod.
 * ExprOut must structurally satisfy the declared virtual type.
 */
type VirtualFulfillmentProperties<ExprOut> = {
   [K in keyof ExprOut]: string | readonly [string]
}

/**
 * Conditional properties type for addPublicFeature / addPrivateFeature:
 * - If NameOut names a virtual contract: expression-only, must satisfy that contract
 * - Otherwise: full FeatureProperties with per-key selector map
 */
type ConditionalFeatureProperties<
   AllCtx extends object,
   VirtualCtx extends object,
   NameOut extends string,
   ExprOut,
   SelectorsMap extends PropertySelectorsMap<AllCtx, ExprOut>,
> = NameOut extends keyof VirtualCtx
   ? ExprOut extends VirtualCtx[NameOut]
      ? VirtualFulfillmentProperties<ExprOut>
      : never // ExprOut does not satisfy the declared virtual contract
   : FeatureProperties<AllCtx, ExprOut, SelectorsMap>

// =============================================================================
// cm() — Type-safe feature method factory
// =============================================================================

/**
 * Create a type-safe {method, selectors} pair for use in feature property definitions.
 *
 * Feature property objects assigned inline lose parameter-type inference because TypeScript
 * cannot flow the selector tuple type back to infer the method's parameter types. This
 * curried helper restores that checking by explicitly binding the merged context type.
 *
 * Pass the pipeline's `AllContext` (or a compatible alias) as the single type argument.
 * The inner call takes `selectors` and `method` with fully-inferred, selector-driven
 * parameter types.
 *
 * @example
 * ```typescript
 * // AllCtx is the full merged context at the point of use
 * type AllCtx = { prefix: Uint8ClampedArray; originalEncoding: BufferEncoding }
 *
 * const prefixDef = cm<AllCtx>()(
 *   ["prefix", "originalEncoding"] as const,
 *   (binary, encoding) => Buffer.from(binary.buffer).toString(encoding),
 *   // ^ typed (Uint8ClampedArray, BufferEncoding) => string — checked at call site
 * )
 * ```
 */
export function cm<AllContext extends object>() {
   return function <
      ReturnType,
      Selectors extends ReadonlyArray<ContextKeysAndPairs<AllContext>>,
   >(
      selectors: Selectors,
      method: (
         ...args: CallableParams<AllContext, Selectors>
      ) => ReturnType | Promise<ReturnType>,
   ): {
      method: (
         ...args: CallableParams<AllContext, Selectors>
      ) => ReturnType | Promise<ReturnType>
      selectors: Selectors
   } {
      return { method, selectors }
   }
}

// =============================================================================
// Codec-compliance helper (exported for future enforcement on ResultOut)
// =============================================================================

type AtomicData = string | number | boolean

/** Compile-time check that T contains only serializable data (no functions). */
export type ValidateJustData<T> = T extends AtomicData
   ? T
   : T extends Array<infer U>
     ? U extends ValidateJustData<U>
        ? T
        : never
     : T extends (...args: never[]) => unknown
       ? never
       : T extends { [K in keyof T]: ValidateJustData<T[K]> }
         ? T
         : never

// =============================================================================
// PipelineBuilder Interface
// =============================================================================

/**
 * Fluent builder for a typed execution pipeline.
 *
 * Type parameters accumulate as builder methods are called:
 * @typeParam InitialContext  - Properties provided by the caller at run time
 * @typeParam InjectedContext - Properties provided by DI (injections)
 * @typeParam ExprContext     - Subset visible to expression-language evaluation (public)
 * @typeParam StepContext     - Full concrete context available to programmatic steps
 * @typeParam VirtualContext  - Declared-but-unbound feature contracts (for Worker Pool)
 * @typeParam AllContext      - Mixin<StepContext, VirtualContext>: cached merged context.
 *                             Maintained as a 6th param so every method site reads it
 *                             directly instead of re-evaluating the Mixin at each use.
 */
export interface PipelineBuilder<
   InitialContext extends object,
   InjectedContext extends object = object,
   ExprContext extends object = InitialContext,
   StepContext extends object = ExprContext,
   VirtualContext extends object = object,
   AllContext extends object = Mixin<StepContext, VirtualContext>,
> {
   /**
    * Extend the initial seed context with additional properties and defaults.
    * Useful for DTO blackbox fields and per-application expression string defaults.
    * Call-time `initial` values override these defaults.
    */
   extendInitial: <ExtraInitial extends object>(
      defaults: CompatibleForMixin<StepContext, ExtraInitial>,
   ) => PipelineBuilder<
      Mixin<InitialContext, ExtraInitial>,
      InjectedContext,
      Mixin<ExprContext, ExtraInitial>,
      Mixin<StepContext, ExtraInitial>,
      VirtualContext,
      Mixin<AllContext, ExtraInitial>
   >

   /**
    * Declare a virtual feature contract.
    *
    * Reserves a namespace name and records the required type shape.
    * Does NOT add to StepContext — concrete fulfillment does that.
    * Steps may reference the virtual in their selectors; they are pruned at
    * runtime if the virtual is never fulfilled.
    *
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addVirtualFeature: <VirtualType extends object, NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext,
      StepContext, // unchanged — virtual is not concrete yet
      WithProp<VirtualContext, typeof nameOut, VirtualType>,
      WithProp<AllContext, typeof nameOut, VirtualType>
   >

   /**
    * Add a step: a programmatic method invoked with typed context selectors.
    * Steps are always public — their output namespace enters both ExprContext and StepContext.
    * If any selector references an unfulfilled virtual, the step is pruned at runtime.
    *
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addStep: <
      StepOut extends object,
      NameOut extends string,
      NamesIn extends ReadonlyArray<ContextKeysAndPairs<AllContext>>,
   >(
      nameOut: UnusedKey<AllContext, NameOut>,
      implementation: ContextualMethod<AllContext, StepOut, NamesIn>,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof StepOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, StepOut>,
      [keyof StepOut] extends [never]
         ? StepContext
         : WithProp<StepContext, typeof nameOut, StepOut>,
      VirtualContext,
      [keyof StepOut] extends [never]
         ? AllContext
         : WithProp<AllContext, typeof nameOut, StepOut>
   >

   /**
    * Add a feature whose namespace is fully visible to expressions.
    *
    * If nameOut matches a declared virtual, fulfills that contract:
    * - Properties restricted to `string | [string]`
    * - ExprOut must structurally satisfy the declared virtual type
    * - The virtual is removed from VirtualContext on fulfillment
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    *
    * Sel maps each property key to its specific selector tuple, enabling per-property
    * parameter-type checking on ContextualMethod values. Use `cm<AllContext>()` to
    * construct individual methods with the correct parameter types.
    */
   addPublicFeature: <
      ExprOut extends object,
      NameOut extends string,
      Sel extends PropertySelectorsMap<AllContext, ExprOut> = Record<
         never,
         never
      >,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: ConditionalFeatureProperties<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         Sel
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, ExprOut>,
      WithProp<StepContext, typeof nameOut, ExprOut>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, ExprOut>
   >

   /**
    * Add a feature whose namespace is hidden from expressions.
    *
    * If nameOut matches a declared virtual, fulfills that contract:
    * - Properties restricted to `string | [string]`
    * - ExprOut must structurally satisfy the declared virtual type
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    */
   addPrivateFeature: <
      ExprOut extends object,
      NameOut extends string,
      Sel extends PropertySelectorsMap<AllContext, ExprOut> = Record<
         never,
         never
      >,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: ConditionalFeatureProperties<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         Sel
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext, // private: ExprContext unchanged
      WithProp<StepContext, typeof nameOut, ExprOut>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, ExprOut>
   >

   /**
    * Add a feature with a public subset (ExprOut) and a private extension (StepOut).
    * StepOut must extend ExprOut — private keys are those in StepOut but not ExprOut.
    * ExprContext receives ExprOut; StepContext receives the full StepOut.
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    * PublicSel / PrivateSel are per-key selector maps for the public and private
    * property groups respectively.
    */
   addFeature: <
      ExprOut extends object,
      NameOut extends string,
      StepOut extends ExprOut = ExprOut,
      PublicSel extends PropertySelectorsMap<AllContext, ExprOut> = Record<
         never,
         never
      >,
      PrivateSel extends PropertySelectorsMap<
         AllContext,
         Omit<StepOut, keyof ExprOut>
      > = Record<never, never>,
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      publicProperties: ConditionalFeatureProperties<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         PublicSel
      >,
      privateProperties: FeatureProperties<
         AllContext,
         Omit<StepOut, keyof ExprOut>,
         PrivateSel
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof ExprOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, ExprOut>,
      WithProp<StepContext, typeof nameOut, StepOut>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, StepOut>
   >

   /**
    * Inject a dependency visible to expressions.
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addPublicInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
      injection: InjectedType,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, InjectedType>,
      WithProp<ExprContext, typeof nameOut, InjectedType>,
      WithProp<StepContext, typeof nameOut, InjectedType>,
      VirtualContext,
      WithProp<AllContext, typeof nameOut, InjectedType>
   >

   /**
    * Inject a dependency hidden from expressions.
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addPrivateInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
      injection: InjectedType,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, InjectedType>,
      ExprContext, // private: ExprContext unchanged
      WithProp<StepContext, typeof nameOut, InjectedType>,
      VirtualContext,
      WithProp<AllContext, typeof nameOut, InjectedType>
   >

   /**
    * Finalize the pipeline.
    *
    * Result selectors address ExprContext (public) or VirtualContext (declared contracts).
    * Returns an async function because steps may be async.
    * Returns `Partial<ResultOut>` because:
    * - A result property is omitted if its selector addresses an unfulfilled virtual.
    * - A result property is omitted if its selector addresses a pruned step's output.
    */
   buildPipeline: <ResultOut extends object>(
      resultSelectors:
         | {
              [K in keyof ResultOut]: ContextKeysAndPairs<
                 Mixin<ExprContext, VirtualContext>
              >
           }
         | ((context: ExprContext) => ResultOut),
   ) => (
      initial: InitialContext,
      injections: InjectedContext,
   ) => Promise<Partial<ResultOut>>
}

// =============================================================================
// Runtime Implementation
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

type SelectorPath = string | readonly [string, string]

/** Compiled expression function produced by jse-eval compile(). Synchronous. */
type CompiledExpr = (ctx: Record<string, unknown>) => unknown

/**
 * Raw feature property value as stored by the builder before buildPipeline()
 * compiles it. The ContextualMethod shape (.method + .selectors) matches the
 * user-facing ContextualMethod interface; compilation renames .method to .fn
 * and wraps it in a PreparedPropertyDef discriminant.
 */
type BuilderPropertyDef =
   | string
   | readonly [string]
   | {
        method: (...args: any[]) => unknown | Promise<unknown>
        selectors: readonly SelectorPath[]
     }

/**
 * Compiled property artefact stored in a PreparedFeature.
 *
 * - "expr"     — string expression compiled once at buildPipeline() time;
 *                evaluated against full stepCtx on every invocation.
 * - "indirect" — two-stage: outer expression compiled once (evaluated against
 *                stepCtx to yield an inner expression string); inner strings
 *                compiled on first encounter and cached for reuse.
 * - "method"   — ContextualMethod; selectors resolved from stepCtx and passed
 *                as positional arguments on every invocation.
 */
type PreparedPropertyDef =
   | { kind: "expr"; fn: CompiledExpr }
   | { kind: "indirect"; outer: CompiledExpr; cache: Map<string, CompiledExpr> }
   | {
        kind: "method"
        fn: (...args: any[]) => unknown | Promise<unknown>
        selectors: readonly SelectorPath[]
     }

// ---------------------------------------------------------------------------
// Builder-time stage types  (accumulated by createBuilderImpl)
// ---------------------------------------------------------------------------

/** Step implementation stored by addStep (method renamed to fn at build time). */
interface RuntimeContextualMethod {
   fn: (...args: any[]) => unknown | Promise<unknown>
   selectors: readonly SelectorPath[]
}

interface RuntimeVirtual {
   kind: "virtual"
   name: string
}

interface RuntimeInitialDefaults {
   kind: "initialDefaults"
   defaults: Record<string, unknown>
}

interface RuntimeFeature {
   kind: "feature"
   name: string
   /** "all" = addPublicFeature, "none" = addPrivateFeature, string[] = addFeature public keys */
   publicKeys: "all" | "none" | string[]
   /** Raw values as provided to the builder; compiled in buildPipeline(). */
   properties: Record<string, BuilderPropertyDef>
}

interface RuntimeStep {
   kind: "step"
   name: string
   impl: RuntimeContextualMethod
}

interface RuntimeInjection {
   kind: "injection"
   name: string
   isPublic: boolean
   value: unknown
}

type RuntimeStage =
   | RuntimeVirtual
   | RuntimeInitialDefaults
   | RuntimeFeature
   | RuntimeStep
   | RuntimeInjection

// ---------------------------------------------------------------------------
// buildPipeline()-time types  (produced by one-time pre-processing)
// ---------------------------------------------------------------------------

/** Feature with all expression properties compiled and ready for execution. */
interface PreparedFeature {
   kind: "feature"
   name: string
   publicKeys: "all" | "none" | string[]
   properties: Record<string, PreparedPropertyDef>
}

/**
 * Execution-order stage: initialDefaults merged into defaults, virtual slots
 * replaced by their fulfilling features (or dropped into the unfulfilled set),
 * and all expression strings compiled to CompiledExpr closures.
 */
type PreparedStage = PreparedFeature | RuntimeStep | RuntimeInjection

// =============================================================================
// Builder Implementation
// =============================================================================

function createBuilderImpl<
   InitialContext extends object,
   InjectedContext extends object,
   ExprContext extends object,
   StepContext extends object,
   VirtualContext extends object,
   AllContext extends object = Mixin<StepContext, VirtualContext>,
>(
   stages: RuntimeStage[],
): PipelineBuilder<
   InitialContext,
   InjectedContext,
   ExprContext,
   StepContext,
   VirtualContext,
   AllContext
> {
   function next(
      stage: RuntimeStage,
   ): PipelineBuilder<any, any, any, any, any, any> {
      return createBuilderImpl([...stages, stage])
   }

   return {
      extendInitial(defaults) {
         return next({
            kind: "initialDefaults",
            defaults: defaults as Record<string, unknown>,
         }) as any
      },

      addVirtualFeature(nameOut) {
         return next({ kind: "virtual", name: nameOut as string }) as any
      },

      addStep(nameOut, implementation) {
         return next({
            kind: "step",
            name: nameOut as string,
            impl: {
               fn: implementation.method as any,
               selectors: implementation.selectors as unknown as SelectorPath[],
            },
         }) as any
      },

      addPublicFeature(nameOut, properties) {
         return next({
            kind: "feature",
            name: nameOut as string,
            publicKeys: "all",
            properties: properties as Record<string, any>,
         }) as any
      },

      addPrivateFeature(nameOut, properties) {
         return next({
            kind: "feature",
            name: nameOut as string,
            publicKeys: "none",
            properties: properties as Record<string, any>,
         }) as any
      },

      addFeature(nameOut, publicProperties, privateProperties) {
         const publicKeys = Object.keys(publicProperties as object)
         return next({
            kind: "feature",
            name: nameOut as string,
            publicKeys,
            properties: {
               ...(publicProperties as Record<string, any>),
               ...(privateProperties as Record<string, any>),
            },
         }) as any
      },

      addPublicInjection(nameOut, injection) {
         return next({
            kind: "injection",
            name: nameOut as string,
            isPublic: true,
            value: injection,
         }) as any
      },

      addPrivateInjection(nameOut, injection) {
         return next({
            kind: "injection",
            name: nameOut as string,
            isPublic: false,
            value: injection,
         }) as any
      },

      buildPipeline(resultSelectors) {
         // ── one-time pre-processing (runs once when buildPipeline() is called) ──

         // Merge all initialDefaults stages into a single baseline object.
         const defaults: Record<string, unknown> = {}
         for (const stage of stages) {
            if (stage.kind === "initialDefaults")
               Object.assign(defaults, stage.defaults)
         }

         // Identify every declared virtual and find its fulfilling feature, if any.
         const virtualNames = new Set<string>()
         for (const stage of stages) {
            if (stage.kind === "virtual") virtualNames.add(stage.name)
         }
         const fulfillments = new Map<string, RuntimeFeature>()
         for (const stage of stages) {
            if (stage.kind === "feature" && virtualNames.has(stage.name))
               fulfillments.set(stage.name, stage)
         }
         // Virtuals with no fulfilling feature will prune any step that depends on them.
         const unfulfilled = new Set<string>(
            [...virtualNames].filter((n) => !fulfillments.has(n)),
         )

         // Compile a raw builder property value into a PreparedPropertyDef.
         // `context` is a human-readable label used in error messages only.
         const compileProperty = (
            raw: BuilderPropertyDef,
            context: string,
         ): PreparedPropertyDef => {
            const tryCompile = (expr: string): CompiledExpr => {
               try {
                  return compile(expr)
               } catch (err) {
                  throw new Error(
                     `Expression parse error in ${context}: ${String(err)}\n  Expression: ${expr}`,
                     { cause: err },
                  )
               }
            }
            if (typeof raw === "string") {
               return { kind: "expr", fn: tryCompile(raw) }
            } else if (raw instanceof Array) {
               return {
                  kind: "indirect",
                  outer: tryCompile(raw[0]),
                  cache: new Map(),
               }
            } else {
               // ContextualMethod: rename .method → .fn for the prepared form.
               return {
                  kind: "method",
                  fn: raw.method,
                  selectors: raw.selectors,
               }
            }
         }

         const compileFeature = (f: RuntimeFeature): PreparedFeature => ({
            kind: "feature",
            name: f.name,
            publicKeys: f.publicKeys,
            properties: Object.fromEntries(
               Object.entries(f.properties).map(([k, v]) => [
                  k,
                  compileProperty(v, `feature "${f.name}", property "${k}"`),
               ]),
            ),
         })

         // Build the execution order:
         //   - Each virtual slot is replaced by its fulfilling feature (if any).
         //   - Fulfilling features are skipped at their original builder position.
         //   - initialDefaults stages are dropped (already merged into defaults).
         //   - Steps and injections pass through unchanged.
         const movedNames = new Set<string>(fulfillments.keys())
         const executionOrder: PreparedStage[] = []
         for (const stage of stages) {
            if (stage.kind === "virtual") {
               const f = fulfillments.get(stage.name)
               if (f !== undefined) executionOrder.push(compileFeature(f))
               // Unfulfilled virtual: omitted from order, tracked in unfulfilled set.
            } else if (stage.kind === "initialDefaults") {
               // Already merged; skip.
            } else if (stage.kind === "feature" && movedNames.has(stage.name)) {
               // Already placed at the virtual's position; skip.
            } else if (stage.kind === "feature") {
               executionOrder.push(compileFeature(stage))
            } else {
               // RuntimeStep | RuntimeInjection — pass through unchanged.
               executionOrder.push(stage)
            }
         }

         const compiledResultSelectors = resultSelectors as
            | Record<string, SelectorPath>
            | ((ctx: Record<string, unknown>) => Record<string, unknown>)

         // ── per-invocation callable ────────────────────────────────────────────
         return async (initial, injections) => {
            // Full context: every concrete value available to steps and methods.
            const stepCtx: Record<string, unknown> = {
               ...defaults,
               ...(initial as Record<string, unknown>),
            }
            // Expression-visible subset: only public outputs reach this context.
            const exprCtx: Record<string, unknown> = {
               ...defaults,
               ...(initial as Record<string, unknown>),
            }
            // Names of stages whose output is unavailable this invocation.
            const pruned = new Set<string>()

            // Resolve a single selector path; returns the value or signals absence.
            const resolvePath = (
               sel: SelectorPath,
               ctx: Record<string, unknown>,
            ): { found: true; value: unknown } | { found: false } => {
               const topKey = typeof sel === "string" ? sel : sel[0]
               if (!(topKey in ctx)) return { found: false }
               if (typeof sel === "string")
                  return { found: true, value: ctx[topKey] }
               const sub = ctx[topKey] as Record<string, unknown>
               if (!(sel[1] in sub)) return { found: false }
               return { found: true, value: sub[sel[1]] }
            }

            // Resolve every selector in the list; returns null if any is absent.
            const resolveArgs = (
               selectors: readonly SelectorPath[],
               ctx: Record<string, unknown>,
            ): unknown[] | null => {
               const args: unknown[] = []
               for (const sel of selectors) {
                  const r = resolvePath(sel, ctx)
                  if (!r.found) return null
                  args.push(r.value)
               }
               return args
            }

            // False if any selector's top-level key is unfulfilled or pruned.
            const selectable = (selectors: readonly SelectorPath[]): boolean =>
               selectors.every((sel) => {
                  const top = typeof sel === "string" ? sel : sel[0]
                  return !pruned.has(top) && !unfulfilled.has(top)
               })

            for (const stage of executionOrder) {
               switch (stage.kind) {
                  case "injection": {
                     // Public injections may be overridden at call time.
                     // Private injections always use the builder-registered value.
                     const value = stage.isPublic
                        ? ((injections as Record<string, unknown>)[
                             stage.name
                          ] ?? stage.value)
                        : stage.value
                     stepCtx[stage.name] = value
                     if (stage.isPublic) exprCtx[stage.name] = value
                     break
                  }

                  case "step": {
                     if (!selectable(stage.impl.selectors)) {
                        pruned.add(stage.name)
                        break
                     }
                     const args = resolveArgs(stage.impl.selectors, stepCtx)
                     if (args === null) {
                        pruned.add(stage.name)
                        break
                     }
                     const result = await Promise.resolve(
                        stage.impl.fn(...args),
                     )
                     // Steps are always public.
                     stepCtx[stage.name] = result
                     exprCtx[stage.name] = result
                     break
                  }

                  case "feature": {
                     const ns: Record<string, unknown> = {}
                     let failed = false
                     for (const [key, propDef] of Object.entries(
                        stage.properties,
                     )) {
                        switch (propDef.kind) {
                           case "expr":
                              ns[key] = propDef.fn(stepCtx)
                              break
                           case "indirect": {
                              // Outer expression yields an inner expression string.
                              const innerExpr = propDef.outer(stepCtx) as string
                              let innerFn = propDef.cache.get(innerExpr)
                              if (innerFn === undefined) {
                                 innerFn = compile(innerExpr)
                                 propDef.cache.set(innerExpr, innerFn)
                              }
                              // Inner expression runs against exprCtx (public subset).
                              ns[key] = innerFn(exprCtx)
                              break
                           }
                           case "method": {
                              const args = resolveArgs(
                                 propDef.selectors,
                                 stepCtx,
                              )
                              if (args === null) {
                                 failed = true
                              } else {
                                 ns[key] = await Promise.resolve(
                                    propDef.fn(...args),
                                 )
                              }
                              break
                           }
                        }
                        if (failed) break
                     }
                     if (failed) {
                        pruned.add(stage.name)
                        break
                     }
                     stepCtx[stage.name] = ns
                     if (stage.publicKeys === "all") {
                        exprCtx[stage.name] = ns
                     } else if (stage.publicKeys !== "none") {
                        // addFeature: only declared public keys enter exprCtx.
                        const publicNs: Record<string, unknown> = {}
                        for (const k of stage.publicKeys) {
                           if (k in ns) publicNs[k] = ns[k]
                        }
                        exprCtx[stage.name] = publicNs
                     }
                     break
                  }
               }
            }

            // Collect results; omit keys whose top-level selector is unavailable.
            if (typeof compiledResultSelectors === "function") {
               return compiledResultSelectors(exprCtx) as any
            }
            const output: Record<string, unknown> = {}
            for (const [resultKey, selector] of Object.entries(
               compiledResultSelectors,
            )) {
               const topKey =
                  typeof selector === "string" ? selector : selector[0]
               if (unfulfilled.has(topKey) || pruned.has(topKey)) continue
               const r = resolvePath(selector, stepCtx)
               if (r.found) output[resultKey] = r.value
            }
            return output as any
         }
      },
   }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Create a new pipeline builder seeded with a known initial context type.
 *
 * @example
 * ```typescript
 * const pipeline = createPipeline<MyInitialState>()
 *   .addPublicFeature("derived", { ... })
 *   .addStep("result", { method: ..., selectors: [...] })
 *   .buildPipeline({ output: ["result", "value"] })
 *
 * const output = await pipeline(initialState, injections)
 * ```
 */
export function createPipeline<
   InitialContext extends object,
>(): PipelineBuilder<
   InitialContext,
   object,
   InitialContext,
   InitialContext,
   object,
   InitialContext
> {
   return createBuilderImpl([])
}

// =============================================================================
// Example Usage
// =============================================================================

export interface FileStore {
   save: (name: string, content: Buffer) => Promise<void>
}

export interface BuiltIn {
   suffix: Uint8ClampedArray
   prefix: Uint8ClampedArray
}

export interface OriginalEncoding {
   originalEncoding: BufferEncoding
}

export interface PathExpressions {
   pathOne: string
}

export interface TranscodedTerms {
   prefix: string
   suffix: string
}

export interface FileStoreSelection {
   selected: FileStore
}

export interface PathTargetSelection {
   selected: string
}

export interface Paths {
   pathOne: string
   pathTwo: string
}

export interface Result {
   filename: string
   status: number
}

// ---------------------------------------------------------------------------
// Programmatic (Origin Process) pipeline — no virtuals needed
// ---------------------------------------------------------------------------

const _s3Store1: FileStore = {
   a: 4,
   save: async (name, buffer: Buffer) => {
      console.log(`store1: ${name}`)
      console.log("Buffer: ", buffer)
      console.log("Buffer: ", buffer.toString("hex"))
   },
}
const _s3Store2: FileStore = {
   a: 9,
   save: async (name, buffer: Buffer) => {
      console.log(`store2: ${name}`)
      console.log("Buffer: ", buffer)
      console.log("Buffer: ", buffer.toString("hex"))
   },
}
console.log(_s3Store1, _s3Store2, _s3Store1.save, _s3Store2.save)
await _s3Store2.save("Wadda", Buffer.from("alphanet", "utf8"))

export const originPipeline = createPipeline<BuiltIn>()
   .extendInitial<OriginalEncoding>({ originalEncoding: "utf8" })
   .extendInitial<PathExpressions>({
      // eslint-disable-next-line no-template-curly-in-string
      pathOne: "`${transcodedTerms.prefix}/${transcodedTerms.suffix}`",
   })
   .addPublicFeature<
      TranscodedTerms,
      "transcodedTerms",
      {
         prefix: readonly ["prefix", "originalEncoding"]
         suffix: readonly ["suffix", "originalEncoding"]
      }
   >("transcodedTerms", {
      prefix: {
         // params inferred from Sel: (binary: Uint8ClampedArray, encoding: BufferEncoding)
         method: (binary, encoding) =>
            Buffer.from(binary.buffer).toString(encoding),
         selectors: ["prefix", "originalEncoding"] as const,
      },
      suffix: {
         method: (binary, encoding) =>
            Buffer.from(binary.buffer).toString(encoding),
         selectors: ["suffix", "originalEncoding"] as const,
      },
   })
   .addPrivateInjection("store1", _s3Store1)
   .addPrivateInjection("store2", _s3Store2)
   .addPrivateFeature<FileStoreSelection, "selectedStore">("selectedStore", {
      // eslint-disable-next-line no-template-curly-in-string
      selected:
         "(transcodedTerms.suffix === transcodedTerms.prefix) ? store1 : store2",
   })
   .addFeature<Paths, "targets">(
      "targets",
      {
         // eslint-disable-next-line no-template-curly-in-string
         pathOne: ["pathOne"],
         // eslint-disable-next-line no-template-curly-in-string
         pathTwo: "`${transcodedTerms.prefix}/${transcodedTerms.suffix}`",
      },
      {},
   )
   .addStep("progress", {
      method: async (_store: FileStore): Promise<{ status: number }> => ({
         status: 5,
      }),
      selectors: [["selectedStore", "selected"] as const] as const,
   })
   .buildPipeline<Result>({
      filename: ["targets", "pathTwo"] as const,
      status: ["progress", "status"] as const,
   })

// ---------------------------------------------------------------------------
// Worker Pool pipeline — uses virtual features for application-supplied contracts
// ---------------------------------------------------------------------------
//
// The framework declares the virtual contract and the steps that depend on it.
// An application fulfills the virtual with expression strings.
// If no application fulfills it, the dependent step is pruned.

export const workerPoolPipeline = createPipeline<BuiltIn>()
   .extendInitial<OriginalEncoding>({ originalEncoding: "utf8" })
   .extendInitial<Paths>({
      pathOne: "a/b/c",
      pathTwo: "`${transcodedTerms.prefix}/${transcodedTerms.suffix}`",
   })
   .addPublicFeature<
      TranscodedTerms,
      "transcodedTerms",
      {
         prefix: readonly ["prefix", "originalEncoding"]
         suffix: readonly ["suffix", "originalEncoding"]
      }
   >("transcodedTerms", {
      prefix: {
         method: (binary, encoding) =>
            Buffer.from(binary.buffer).toString(encoding),
         selectors: ["prefix", "originalEncoding"] as const,
      },
      suffix: {
         method: (binary, encoding) =>
            Buffer.from(binary.buffer).toString(encoding),
         selectors: ["suffix", "originalEncoding"] as const,
      },
   })
   .addPrivateInjection("store1", _s3Store1)
   .addPrivateInjection("store2", _s3Store2)
   // Framework declares the contract an application must fulfill to enable staging
   .addVirtualFeature<FileStoreSelection, "stagingStrategy">("stagingStrategy")
   .addVirtualFeature<PathTargetSelection, "stagedFilePath">("stagedFilePath")
   // Framework registers the step — it references the virtual, so it will be
   // pruned at runtime for any application that does not fulfill stagingStrategy
   .addStep("stagingResult", {
      method: async (
         store: FileStore,
         filePath: string,
      ): Promise<{ status: number }> => {
         console.log(store, filePath)
         await store.save(filePath, Buffer.alloc(0))
         return { status: 1 }
      },
      selectors: [
         ["stagingStrategy", "selected"] as const,
         ["stagedFilePath", "selected"] as const,
      ] as const,
   })
   // Application fulfills the virtual with expression strings (no executable code)
   .addPublicFeature<PathTargetSelection, "stagedFilePath">("stagedFilePath", {
      // Indirect form: outer evaluates `pathTwo` from context to get an
      // expression string; inner then evaluates that expression against
      // exprCtx to yield the final path.
      // eslint-disable-next-line no-template-curly-in-string
      selected: ["pathTwo"],
   })
   .addPrivateFeature<FileStoreSelection, "stagingStrategy">(
      "stagingStrategy",
      {
         selected:
            "(transcodedTerms.suffix === transcodedTerms.prefix) ? store1 : store2",
      },
   )
   .buildPipeline<{ status: number }>({
      status: ["stagingResult", "status"] as const,
   })

export const lala = workerPoolPipeline(
   {
      prefix: Uint8ClampedArray.of(1, 2, 3),
      suffix: Uint8ClampedArray.of(8, 7, 6),
      originalEncoding: "hex",
      // eslint-disable-next-line no-template-curly-in-string
      pathOne: "'eatDirt'",
      pathTwo: "`${transcodedTerms.prefix}/${transcodedTerms.suffix}`",
   },
   { store1: _s3Store1, store2: _s3Store2 },
)

console.log(lala)
console.log(await lala)
