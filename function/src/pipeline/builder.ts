import type {
   UnusedKey,
   CompatibleForMixin,
   InitialInput,
   Mixin,
   WithProp,
   ContextKeysAndPairs,
   CallableParams,
} from "./types.js"

// =============================================================================
// IBasePipelineBuilder — shared vocabulary for PipelineBuilder and SegmentBlueprint
// =============================================================================

/**
 * Structural base interface shared by PipelineBuilder and SegmentBlueprint.
 *
 * Captures the common operation vocabulary (method names and loose parameter
 * shapes) so that code handling either kind of builder can reference a single
 * type.  Both concrete interfaces provide fully-typed method signatures that
 * override these loose stubs.
 *
 * Uses method-shorthand syntax so TypeScript applies bivariance for parameter
 * types, permitting concrete implementations to narrow the parameter types
 * without triggering strictFunctionTypes violations.
 */
export interface IBasePipelineBuilder {
   /* eslint-disable @typescript-eslint/method-signature-style */
   extendInitial(defaults: object): IBasePipelineBuilder
   addVirtualFeature(nameOut: string): IBasePipelineBuilder
   addPublicFeature(nameOut: string, properties: object): IBasePipelineBuilder
   addPrivateFeature(nameOut: string, properties: object): IBasePipelineBuilder
   addStep(nameOut: string, implementation: object): IBasePipelineBuilder
   addPrivateInjection(nameOut: string): IBasePipelineBuilder
   /* eslint-enable @typescript-eslint/method-signature-style */
}

// =============================================================================
// ContextualMethod
// =============================================================================

/**
 * A typed method bound to selected context values.
 * The method's parameter types are inferred from the selectors.
 */
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
export type PropertySelectorsMap<Context extends object, Props> = {
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
export type FeatureProperties<
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
export type VirtualFulfillmentProperties<ExprOut> = {
   [K in keyof ExprOut]: string | readonly [string]
}

/**
 * Conditional properties type for addPublicFeature / addPrivateFeature:
 * - If NameOut names a virtual contract: expression-only, must satisfy that contract
 * - Otherwise: full FeatureProperties with per-key selector map
 */
export type ConditionalFeatureProperties<
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
   InitialContext extends object = {},
   InjectedContext extends object = {},
   ExprContext extends object = InitialContext,
   StepContext extends object = ExprContext,
   VirtualContext extends object = {},
   AllContext extends object = Mixin<StepContext, VirtualContext>,
> {
   /**
    * Extend the initial seed context with additional properties.
    *
    * ExtraInitial is the full shape added to ExprContext and StepContext —
    * must be supplied explicitly when it is wider than ExtraDefaults.
    * ExtraDefaults is inferred from the defaults argument alone; it must be a
    * partial of ExtraInitial (only declared keys may be defaulted).
    *
    * The resulting InitialContext contribution is InitialInput<ExtraInitial, ExtraDefaults>:
    *   Partial<ExtraDefaults> & Omit<ExtraInitial, keyof ExtraDefaults>
    * — defaulted fields are optional in the call signature; fields present in
    * ExtraInitial but absent from ExtraDefaults are required.
    *
    * Returns never if ExtraInitial conflicts with the existing StepContext.
    */
   extendInitial: <
      ExtraInitial extends object,
      ExtraDefaults extends Partial<ExtraInitial> = Partial<ExtraInitial>,
   >(
      defaults: ExtraDefaults,
   ) => [CompatibleForMixin<StepContext, ExtraInitial>] extends [never]
      ? never
      : PipelineBuilder<
           Mixin<InitialContext, InitialInput<ExtraInitial, ExtraDefaults>>,
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
    * Declare an injection slot visible to expressions.
    *
    * The slot is typed as InjectedType and added to InjectedContext, shaping the
    * `injections` argument of the compiled pipeline function.  The actual value is
    * supplied at call time — nothing is captured in the builder.
    *
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addPublicInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, InjectedType>,
      WithProp<ExprContext, typeof nameOut, InjectedType>,
      WithProp<StepContext, typeof nameOut, InjectedType>,
      VirtualContext,
      WithProp<AllContext, typeof nameOut, InjectedType>
   >

   /**
    * Declare an injection slot hidden from expressions.
    *
    * The slot is typed as InjectedType and added to InjectedContext, shaping the
    * `injections` argument of the compiled pipeline function.  The actual value is
    * supplied at call time — nothing is captured in the builder.
    *
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addPrivateInjection: <InjectedType, NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
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
