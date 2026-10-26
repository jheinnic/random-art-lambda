import type {
   UnusedKey,
   InitialInput,
   Mixin,
   WithProp,
   ContextKeysAndPairs,
   CallableParams,
   ExpressionBasedFeature,
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
   Params extends CallableParams<Context, ParamSelectors> = CallableParams<
      Context,
      ParamSelectors
   >,
> {
   method: (...args: Params) => ReturnedType | Promise<ReturnedType>
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
   | ExpressionBasedFeature
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
   : ExpressionBasedFeature

/**
 * Validates all feature properties against ExprOut.
 * - For each key K in ExprOut, CheckProp validates the method form if present.
 * - Keys missing from Props default to `ExpressionBasedFeature` (expression form is always valid).
 * - Keys in Props not present in ExprOut are mapped to `never` (rejected).
 */
export type CheckFeatureProps<
   Context extends object,
   ExprOut extends object,
   Props,
> = {
   [K in keyof ExprOut]: K extends keyof Props
      ? CheckProp<Context, ExprOut[K], Props[K]>
      : ExpressionBasedFeature
} & { [K in Exclude<keyof Props, keyof ExprOut>]: never }

export type WithPublicFeature<
   Builder extends PipelineBuilder,
   FeatureName extends string,
   SubjectType extends object,
> =
   Builder extends PipelineBuilder<
      infer InitialContext,
      infer InjectedContext,
      infer ExprContext,
      infer StepContext,
      infer VirtualContext,
      infer StepResultContext,
      infer AllContext
   >
      ? PipelineBuilder<
           InitialContext,
           InjectedContext,
           WithProp<ExprContext, FeatureName, SubjectType>,
           WithProp<StepContext, FeatureName, SubjectType>,
           Omit<VirtualContext, FeatureName>,
           StepResultContext,
           WithProp<Omit<AllContext, FeatureName>, FeatureName, SubjectType>
        >
      : never

export type WithPrivateFeature<
   Builder extends PipelineBuilder,
   FeatureName extends string,
   SubjectType extends object,
> =
   Builder extends PipelineBuilder<
      infer InitialContext,
      infer InjectedContext,
      infer ExprContext,
      infer StepContext,
      infer VirtualContext,
      infer StepResultContext,
      infer AllContext
   >
      ? PipelineBuilder<
           InitialContext,
           InjectedContext,
           ExprContext,
           WithProp<StepContext, FeatureName, SubjectType>,
           Omit<VirtualContext, FeatureName>,
           StepResultContext,
           WithProp<Omit<AllContext, FeatureName>, FeatureName, SubjectType>
        >
      : never

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
   StepResultContext extends object = {},
   AllContext extends object = {}, // Mixin<StepContext, VirtualContext>,
> {
   withContextSubject: <SubjectType extends object>() => PipelineContextBuilder<
      SubjectType,
      InitialContext,
      InjectedContext,
      ExprContext,
      StepContext,
      VirtualContext,
      StepResultContext,
      AllContext
   >

   withSplitContextSubject: <
      PublicSubjectType extends object,
      PrivateSubjectType extends PublicSubjectType,
   >() => PipelineSplitContextBuilder<
      PublicSubjectType,
      PrivateSubjectType,
      InitialContext,
      InjectedContext,
      ExprContext,
      StepContext,
      VirtualContext,
      StepResultContext,
      AllContext
   >

   /**
    * Seed a pure function into the expression context.
    *
    * Unlike injections, pure functions are constant values captured once at
    * buildPipeline() time — they do NOT appear in InjectedContext and do NOT vary
    * per request.  They are seeded into ExprContext only, not StepContext or
    * AllContext, so they are usable in expression strings but NOT as step selectors.
    *
    * nameOut must be absent from ExprContext.
    */
   addPureFunction: <
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      FnType extends (...args: any[]) => unknown,
      NameOut extends string,
   >(
      nameOut: UnusedKey<ExprContext, NameOut>,
      fn: FnType,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, FnType>,
      StepContext,
      VirtualContext,
      AllContext,
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

interface PipelineContextBuilder<
   SubjectType extends object,
   InitialContext extends object,
   InjectedContext extends object,
   ExprContext extends object,
   StepContext extends object,
   VirtualContext extends object,
   StepResultContext extends object,
   AllContext extends object,
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
      NameOut extends string,
      HasDefaults extends keyof SubjectType = never,
   >(
      nameOut: UnusedKey<AllContext, NameOut>,
      defaults: Pick<SubjectType, HasDefaults>,
   ) => PipelineBuilder<
      WithProp<
         InitialContext,
         typeof nameOut,
         InitialInput<SubjectType, HasDefaults>
      >,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, SubjectType>,
      WithProp<StepContext, typeof nameOut, SubjectType>,
      VirtualContext,
      StepResultContext,
      WithProp<AllContext, typeof nameOut, SubjectType>
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
   addVirtualFeature: <NameOut extends string>(
      nameOut: UnusedKey<VirtualContext, NameOut>,
   ) => NameOut extends keyof StepContext
      ? StepContext[NameOut] extends SubjectType
         ? SubjectType extends StepContext[NameOut]
            ? PipelineBuilder<
                 InitialContext,
                 InjectedContext,
                 ExprContext,
                 StepContext,
                 VirtualContext,
                 StepResultContext,
                 AllContext
              >
            : never // VirtualType is incompatible with the already-concrete type
         : never // VirtualType is incompatible with the already-concrete type
      : PipelineBuilder<
           InitialContext,
           InjectedContext,
           ExprContext,
           StepContext,
           WithProp<VirtualContext, typeof nameOut, SubjectType>,
           StepResultContext,
           WithProp<AllContext, typeof nameOut, SubjectType>
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
      NameOut extends string,
      NamesIn extends ReadonlyArray<ContextKeysAndPairs<AllContext>>,
      Params extends CallableParams<AllContext, NamesIn>,
   >(
      nameOut: UnusedKey<AllContext, NameOut>,
      implementation: ContextualMethod<
         AllContext,
         SubjectType,
         NamesIn,
         Params
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext,
      StepContext,
      VirtualContext,
      WithProp<StepResultContext, typeof nameOut, SubjectType>,
      AllContext
   >

   /**
    * Add a feature whose namespace is fully visible to expressions.
    *
    * If nameOut matches a declared virtual, fulfills that contract:
    * - SubjectType must bidirectionally satisfy the declared virtual type.
    * - The virtual is removed from VirtualContext on fulfillment.
    *
    * nameOut must be absent from StepContext (may equal a virtual in VirtualContext).
    *
    * Props is inferred from the argument. Each method-form property is validated
    * to ensure its method's parameter types match what the selectors resolve.
    */
   addPublicFeature: <
      NameOut extends string,
      Props extends { [K in keyof SubjectType]: LooseFeatureProp } = {
         [K in keyof SubjectType]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         SubjectType,
         SubjectType,
         Props
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      WithProp<ExprContext, typeof nameOut, SubjectType>,
      WithProp<StepContext, typeof nameOut, SubjectType>,
      Omit<VirtualContext, NameOut>,
      StepResultContext,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, SubjectType>
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
      NameOut extends string,
      Props extends { [K in keyof SubjectType]: LooseFeatureProp } = {
         [K in keyof SubjectType]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      properties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         SubjectType,
         SubjectType,
         Props
      >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      ExprContext, // private: ExprContext unchanged
      WithProp<StepContext, typeof nameOut, SubjectType>,
      Omit<VirtualContext, NameOut>,
      StepResultContext,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, SubjectType>
   >

   /**
    * Declare an injection slot visible to expressions.
    *
    * The slot is typed as SubjectType and added to InjectedContext, shaping the
    * `injections` argument of the compiled pipeline function.  The actual value is
    * supplied at call time — nothing is captured in the builder.
    *
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addPublicInjection: <NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, SubjectType>,
      WithProp<ExprContext, typeof nameOut, SubjectType>,
      WithProp<StepContext, typeof nameOut, SubjectType>,
      VirtualContext,
      StepResultContext,
      WithProp<AllContext, typeof nameOut, SubjectType>
   >

   /**
    * Declare an injection slot hidden from expressions.
    *
    * The slot is typed as SubjectType and added to InjectedContext, shaping the
    * `injections` argument of the compiled pipeline function.  The actual value is
    * supplied at call time — nothing is captured in the builder.
    *
    * nameOut must be absent from AllContext (i.e. from both StepContext and VirtualContext).
    */
   addPrivateInjection: <NameOut extends string>(
      nameOut: UnusedKey<AllContext, NameOut>,
   ) => PipelineBuilder<
      InitialContext,
      WithProp<InjectedContext, typeof nameOut, SubjectType>,
      ExprContext, // private: ExprContext unchanged
      WithProp<StepContext, typeof nameOut, SubjectType>,
      VirtualContext,
      StepResultContext,
      WithProp<AllContext, typeof nameOut, SubjectType>
   >
}

interface PipelineSplitContextBuilder<
   PublicSubjectType extends object,
   PrivateSubjectType extends PublicSubjectType,
   InitialContext extends object,
   InjectedContext extends object,
   ExprContext extends object,
   StepContext extends object,
   VirtualContext extends object,
   StepResultContext extends object,
   AllContext extends object,
> {
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
      NameOut extends string,
      Props extends { [K in keyof PublicSubjectType]: LooseFeatureProp } = {
         [K in keyof PublicSubjectType]: LooseFeatureProp
      },
      PrivateProps extends {
         [K in keyof Omit<
            PrivateSubjectType,
            keyof PublicSubjectType
         >]: LooseFeatureProp
      } = {
         [K in keyof Omit<
            PrivateSubjectType,
            keyof PublicSubjectType
         >]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      publicProperties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         PublicSubjectType,
         PrivateSubjectType,
         Props
      >,
      privateProperties: PrivateProps &
         CheckFeatureProps<
            AllContext,
            Omit<PrivateSubjectType, keyof PublicSubjectType>,
            PrivateProps
         >,
   ) => PipelineBuilder<
      InitialContext,
      InjectedContext,
      [keyof PublicSubjectType] extends [never]
         ? ExprContext
         : WithProp<ExprContext, typeof nameOut, PublicSubjectType>,
      WithProp<StepContext, typeof nameOut, PrivateSubjectType>,
      Omit<VirtualContext, NameOut>,
      WithProp<Omit<AllContext, NameOut>, typeof nameOut, PrivateSubjectType>,
      StepResultContext
   >
}
