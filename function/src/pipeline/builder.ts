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
 * Broad union for a feature property value — accepts any form without
 * parameter checking. Used as the upper bound for `Props` inference.
 */
export type LooseFeatureProp =
   | string
   | readonly [string]
   | {
        method: (...args: any[]) => any // eslint-disable-line @typescript-eslint/no-explicit-any
        selectors: ReadonlyArray<string | readonly [string, string]>
     }

/**
 * Validates a single feature property:
 * - String/readonly-[string] forms pass through unchanged.
 * - Method-shape: infers the selector tuple S and checks that the method's
 *   parameter types match CallableParams<Context, S>.  On mismatch, returns
 *   the expected shape so TypeScript surfaces a precise error at the property.
 */
export type CheckProp<Context extends object, PropType, Prop> = Prop extends {
   method: infer M
   selectors: infer S extends ReadonlyArray<ContextKeysAndPairs<Context>>
}
   ? [M] extends [
        (...args: CallableParams<Context, S>) => PropType | Promise<PropType>,
     ]
      ? Prop
      : {
           method: (
              ...args: CallableParams<Context, S>
           ) => PropType | Promise<PropType>
           selectors: S
        }
   : Prop

/**
 * Validates all feature properties against ExprOut.
 * - For each key K in ExprOut, CheckProp validates the method form if present.
 * - Keys missing from Props default to `string` (expression form is always valid).
 * - Keys in Props not present in ExprOut are mapped to `never` (rejected).
 */
export type CheckFeatureProps<
   Context extends object,
   ExprOut extends object,
   Props,
> = {
   [K in keyof ExprOut]: K extends keyof Props
      ? CheckProp<Context, ExprOut[K], Props[K]>
      : string
} & { [K in Exclude<keyof Props, keyof ExprOut>]: never }

/**
 * Virtual-fulfillment guard: if NameOut names a virtual contract, CombinedOut
 * must bidirectionally satisfy that contract.  Otherwise, all feature property
 * forms are accepted.
 *
 * CombinedOut is the full type of the feature (including private properties for
 * addFeature).  For addPublicFeature / addPrivateFeature, CombinedOut = ExprOut.
 */
export type ConditionalFeatureProps<
   AllCtx extends object,
   VirtualCtx extends object,
   NameOut extends string,
   ExprOut extends object,
   CombinedOut extends ExprOut,
   Props,
> = NameOut extends keyof VirtualCtx
   ? CombinedOut extends VirtualCtx[NameOut]
      ? VirtualCtx[NameOut] extends CombinedOut
         ? Props & CheckFeatureProps<AllCtx, ExprOut, Props>
         : never // CombinedOut does not satisfy the virtual contract
      : never // CombinedOut does not satisfy the virtual contract
   : Props & CheckFeatureProps<AllCtx, ExprOut, Props>

// =============================================================================
// PipelineBuilder Interface
// =============================================================================

/**
 * Fluent builder for a typed execution pipeline.
 *
 * Type parameters accumulate as builder methods are called:
 * @typeParam InitialContext     - Properties provided by the caller at run time
 * @typeParam InjectedContext    - Properties provided by DI (injections)
 * @typeParam ExprContext        - Subset visible to expression-language evaluation (public)
 * @typeParam StepContext        - Full concrete context available to programmatic steps
 * @typeParam VirtualContext     - Declared-but-unbound feature contracts
 * @typeParam AllContext         - Mixin<StepContext, VirtualContext>: cached merged context
 * @typeParam StepResultContext  - Outputs produced by addStep calls; isolated from features;
 *                                 accessible only to buildPipeline result selectors
 */
export interface PipelineBuilder<
   InitialContext extends object = {},
   InjectedContext extends object = {},
   ExprContext extends object = InitialContext,
   StepContext extends object = ExprContext,
   VirtualContext extends object = {},
   AllContext extends object = Mixin<StepContext, VirtualContext>,
   StepResultContext extends object = {},
> {
   /**
    * Extend the initial seed context with additional properties.
    *
    * ExtraInitial is the full shape added to ExprContext and StepContext —
    * must be supplied explicitly since it is wider than the defaults object.
    * HasDefaults is inferred from the keys of the defaults argument.
    *
    * The resulting InitialContext contribution is InitialInput<ExtraInitial, HasDefaults>:
    *   Partial<Pick<ExtraInitial, HasDefaults>> & Omit<ExtraInitial, HasDefaults>
    * — defaulted fields are optional in the call signature; fields absent from
    * the defaults object remain required.
    *
    * Returns never if ExtraInitial conflicts with the existing StepContext.
    */
   extendInitial: <
      ExtraInitial extends object,
      HasDefaults extends keyof ExtraInitial = never,
   >(
      defaults: Pick<ExtraInitial, HasDefaults>,
   ) => [CompatibleForMixin<StepContext, ExtraInitial>] extends [never]
      ? never
      : PipelineBuilder<
           Mixin<InitialContext, InitialInput<ExtraInitial, HasDefaults>>,
           InjectedContext,
           Mixin<ExprContext, ExtraInitial>,
           Mixin<StepContext, ExtraInitial>,
           VirtualContext,
           Mixin<AllContext, ExtraInitial>,
           StepResultContext
        >

   /**
    * Declare a virtual feature contract.
    *
    * Reserves a namespace name and records the required type shape.
    * Does NOT add to StepContext — concrete fulfillment does that.
    * Steps may reference the virtual in their selectors; they are pruned at
    * runtime if the virtual is never fulfilled.
    *
    * nameOut must be absent from VirtualContext (duplicate virtual declaration is rejected).
    * If nameOut is already in StepContext (already concrete):
    *   - VirtualType must be assignable to the concrete type, otherwise never.
    *   - If assignable, this is a no-op (the concrete value already satisfies the contract).
    */
   addVirtualFeature: <VirtualType extends object, NameOut extends string>(
      nameOut: UnusedKey<VirtualContext, NameOut>,
   ) => NameOut extends keyof StepContext
      ? StepContext[NameOut] extends VirtualType
         ? VirtualType extends StepContext[NameOut]
            ? PipelineBuilder<
                 InitialContext,
                 InjectedContext,
                 ExprContext,
                 StepContext,
                 VirtualContext,
                 AllContext,
                 StepResultContext
              >
            : never // VirtualType is incompatible with the already-concrete type
         : never // VirtualType is incompatible with the already-concrete type
      : PipelineBuilder<
           InitialContext,
           InjectedContext,
           ExprContext,
           StepContext,
           WithProp<VirtualContext, typeof nameOut, VirtualType>,
           WithProp<AllContext, typeof nameOut, VirtualType>,
           StepResultContext
        >

   /**
    * Add a step: a programmatic method invoked with typed context selectors.
    *
    * Steps are post-processing delegation points. Their outputs accumulate in
    * StepResultContext, which is isolated from features — features cannot read
    * step outputs, and steps cannot read other steps' outputs.
    *
    * StepResultContext is accessible only to buildPipeline result selectors,
    * enabling final output construction from both feature context and step results.
    *
    * If any selector references an unfulfilled virtual, the step is pruned at
    * runtime and its output key is absent from the final result.
    *
    * nameOut must be absent from AllContext and from StepResultContext.
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
      ExprContext,
      StepContext,
      VirtualContext,
      AllContext,
      WithProp<StepResultContext, typeof nameOut, StepOut>
   >

   /**
    * Add a feature whose namespace is fully visible to expressions.
    *
    * If nameOut matches a declared virtual, fulfills that contract:
    * - ExprOut must bidirectionally satisfy the declared virtual type.
    * - The virtual is removed from VirtualContext on fulfillment.
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    *
    * Props is inferred from the argument. Each method-form property is validated
    * to ensure its method's parameter types match what the selectors resolve.
    */
   addPublicFeature: <
      ExprOut extends object,
      NameOut extends string,
      Props extends { [K in keyof ExprOut]: LooseFeatureProp } = {
         [K in keyof ExprOut]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         ExprOut,
         Props
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, ExprOut>,
      WithProp<StepContext, typeof nameOut, ExprOut>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, ExprOut>,
      StepResultContext
   >

   /**
    * Add a feature whose namespace is hidden from expressions.
    *
    * If nameOut matches a declared virtual, fulfills that contract:
    * - ExprOut must bidirectionally satisfy the declared virtual type.
    * - The virtual is removed from VirtualContext on fulfillment.
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    */
   addPrivateFeature: <
      ExprOut extends object,
      NameOut extends string,
      Props extends { [K in keyof ExprOut]: LooseFeatureProp } = {
         [K in keyof ExprOut]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         ExprOut,
         Props
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext, // private: ExprContext unchanged
      WithProp<StepContext, typeof nameOut, ExprOut>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, ExprOut>,
      StepResultContext
   >

   /**
    * Add a feature with a public subset (ExprOut) and a private extension (StepOut).
    * StepOut must extend ExprOut — private keys are those in StepOut but not ExprOut.
    * ExprContext receives ExprOut; StepContext receives the full StepOut.
    *
    * For virtual fulfillment, the full StepOut is checked against the contract —
    * the virtual declared the full required type, not just the public portion.
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    */
   addFeature: <
      ExprOut extends object,
      NameOut extends string,
      StepOut extends ExprOut = ExprOut,
      Props extends { [K in keyof ExprOut]: LooseFeatureProp } = {
         [K in keyof ExprOut]: string
      },
      PrivateProps extends {
         [K in keyof Omit<StepOut, keyof ExprOut>]: LooseFeatureProp
      } = { [K in keyof Omit<StepOut, keyof ExprOut>]: string },
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      publicProperties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         StepOut,
         Props
      >,
      privateProperties: PrivateProps &
         CheckFeatureProps<
            AllContext,
            Omit<StepOut, keyof ExprOut>,
            PrivateProps
         >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof ExprOut] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, ExprOut>,
      WithProp<StepContext, typeof nameOut, StepOut>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, StepOut>,
      StepResultContext
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
      WithProp<AllContext, typeof nameOut, InjectedType>,
      StepResultContext
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
      WithProp<AllContext, typeof nameOut, InjectedType>,
      StepResultContext
   >

   /**
    * Finalize the pipeline.
    *
    * Returns a curried function: the outer call binds singleton injections (DI
    * resolved once per pipeline instance); the inner call processes one request.
    *
    * Result selectors address ExprContext (public features) or StepResultContext
    * (step outputs).  A result key is omitted if its selector references an
    * unfulfilled virtual or a pruned step.
    *
    * Returns `Partial<ResultOut>` because pruned steps or unfulfilled virtuals
    * may leave some result keys absent.
    */
   buildPipeline: <ResultOut extends object>(
      resultSelectors:
         | {
              [K in keyof ResultOut]: ContextKeysAndPairs<
                 Mixin<ExprContext, StepResultContext>
              >
           }
         | ((context: Mixin<ExprContext, StepResultContext>) => ResultOut),
   ) => (
      injections: InjectedContext,
   ) => (initial: InitialContext) => Promise<Partial<ResultOut>>
}
