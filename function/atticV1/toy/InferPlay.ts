interface Authority {
	aOne: string,
	bTwo: number
	cThree: boolean[]
}

export type ContextKeyPairs<Context extends object> = {
   [K in keyof Context]: readonly [K, keyof Context[K]]
}[keyof Context]

/** Union of all valid single-key or two-level path selectors for Context. */
export type ContextKeysAndPairs<Context extends object> = {
   [K in keyof Context]: K | readonly [K, keyof Context[K]]
}[keyof Context]

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
    ExprOut extends object,
    SelectorsMap extends PropertySelectorsMap<Context, ExprOut>,
 > = {
    [K in keyof Props]: K extends keyof SelectorsMap
       ? ContextualMethod<Context, Props[K], NonNullable<SelectorsMap[K]>>
       :
            | readonly [string] // two-stage: outer expr (StepContext) → inner (ExprContext sandbox)
            | string // developer-config expression: full StepContext access
}

export type CallableParams<
   Context extends object,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> = {
   [N in keyof ParamSelectors]: ParamSelectors[N] extends keyof Context
      ? Context[ParamSelectors[N]]
      : ParamSelectors[N] extends ContextKeyPairs<Context>
        ? Context[ParamSelectors[N][0]][ParamSelectors[N][1]]
        : never
}


 /**
  * Conditional properties type for addPublicFeature / addPrivateFeature:
  * - If NameOut names a virtual contract: expression-only, must satisfy that contract
  * - Otherwise: full FeatureProperties with per-key selector map
  *   
  * Virtual-fulfillment guard: if NameOut names a virtual contract, CombinedOut
  * must bidirectionally satisfy that contract.  Otherwise, all feature property
  * forms are accepted.
  *
  * CombinedOut is the full type of the feature (including private properties for
  * addFeature).  For addPublicFeature / addPrivateFeature, CombinedOut = ExprOut.
  */
export type ConditionalFeatureProperties<
    AllCtx extends object,
    VirtualCtx extends object,
    NameOut extends string,
    ExprOut extends object,
    CombinedOut extends ExprOut,
    SelectorsMap extends PropertySelectorsMap<AllCtx, ExprOut>,
 > = NameOut extends keyof VirtualCtx
    ? CombinedOut extends VirtualCtx[NameOut]
       ? VirtualCtx[NameOut] extends CombinedOut
          ? FeatureProperties<AllCtx, ExprOut, SelectorsMap>
          : never // CombinedOut does not satisfy the declared virtual contract
       : never // CombinedOut does not satisfy the declared virtual contract
    : FeatureProperties<AllCtx, ExprOut, SelectorsMap>


interface ContextualMethod<Context extends object, ReturnedType,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> {
   method: (
      ...args: CallableParams<Context, ParamSelectors>
   ) => ReturnedType | Promise<ReturnedType>
   selectors: ParamSelectors
}

type AContextualMethod<Context extends object, ReturnedType> = {
   method: (
      ...args: CallableParams<Context, ParamSelectors>
   ) => ReturnedType | Promise<ReturnedType>
   selectors: ParamSelectors
}

   addPublicFeature: <
      ExprOut extends object,
      NameOut extends string,
      Selectors extends PropertySelectorsMap<AllContext, ExprOut>
   >(
      nameOut: UnusedKey<StepContext, NameOut>,
      selectors: Sel,
      properties: ConditionalFeatureProps<
         AllContext,
         VirtualContext,
         NameOut,
         ExprOut,
         ExprOut,
         Selectors
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

