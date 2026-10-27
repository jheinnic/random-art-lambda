/* eslint-disable @typescript-eslint/method-signature-style */
// =============================================================================
// SegmentBlueprint — typed pipeline segment helper factory
// =============================================================================
//
// A SegmentBlueprint is built using the same vocabulary as PipelineBuilder, but
// starts from an EMPTY context so all TypeScript conditional type checks evaluate
// on concrete types rather than unconstrained generics.
//
// Dependencies — context values that must already be CONCRETE in the target
// builder — are declared via addVirtualDependency().  They are tracked in
// RequiredAC and checked by BeforeSegment, but are NOT replayed in buildHelper()
// because the real builder already has them concrete.
//
// New virtual contracts — ones this segment introduces — are declared via
// addVirtualFeature().  They ARE replayed in buildHelper().
//
// All `as any` usage is confined to the factory function implementation;
// segment developers never write unsafe casts.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
   UnusedKey,
   WithProp,
   OptionalWithProp,
   InitialInput,
   ContextKeysAndPairs,
   CallableParams,
   ExpressionBasedFeature,
} from "./types.js"
import type {
   PipelineBuilder,
   ContextualMethod,
   LooseFeatureProp,
   ConditionalFeatureProps,
} from "./builder.js"

// =============================================================================
// Internal merge utility
// =============================================================================

type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T

/**
 * Merge A with B; B's value wins for shared keys.
 * Only used where BeforeSegment has already verified shared keys have identical
 * types, so A-wins vs B-wins is immaterial.
 */
type CompatibleMerge<A extends object, B extends object> = Simplify<
   Omit<A, keyof B> & B
>

// =============================================================================
// Compatibility checks  (used in BeforeSegment)
// =============================================================================

/**
 * True if every key of Addition that already exists in Existing has an
 * identical type (bidirectional assignability).
 * Keys absent from Existing are always accepted.
 */
type CompatibleAddition<Existing extends object, Addition extends object> = [
   {
      [K in keyof Addition & keyof Existing]: [Existing[K]] extends [
         Addition[K],
      ]
         ? [Addition[K]] extends [Existing[K]]
            ? 1
            : 0
         : 0
   }[keyof Addition & keyof Existing],
] extends [1]
   ? true
   : false

/**
 * True if every key of Required exists in AC with an assignable type.
 */
type RequiredPresent<AC extends object, Required extends object> = [
   keyof Required,
] extends [keyof AC]
   ? [
        {
           [K in keyof Required & keyof AC]: [AC[K]] extends [Required[K]]
              ? 1
              : 0
        }[keyof Required & keyof AC],
     ] extends [1]
      ? true
      : false
   : false

// =============================================================================
// BeforeSegment / AfterSegment
// =============================================================================

/**
 * Narrows a PipelineBuilder B to only those where the segment's additions are
 * safe to apply:
 *
 *   - Each name in AddedSC is absent from B's AllContext, or present with
 *     an identical type (idempotent re-application is allowed)
 *   - Each name in AddedVC is absent from B's AllContext, or present with
 *     an identical type
 *   - All entries in RequiredAC are present in B's AllContext with compatible types
 *   - No key in AddedEC targets a name that is private (in SC but not EC) in B,
 *     which would illegally promote a private feature to expression-visible
 *   - All entries in RequiredIC are present in B's InitialContext — the witness
 *     established these fields as caller-supplied inputs, so the real builder must
 *     also source them from IC (not from derived features or injections)
 *   - All entries in RequiredInjC are present in B's InjectedContext — the witness
 *     established these as DI-supplied; the real builder must inject them, not
 *     derive them from IC or features
 *   - All entries in RequiredEC are present in B's ExprContext — the witness
 *     established these as expression-visible; the real builder must not keep
 *     them private
 *
 * Evaluates to B itself when all constraints pass, or `never` on any violation.
 * Applied as the type of the `builder` parameter in the generated helper function,
 * so violations surface as type errors at the call site.
 */
export type BeforeSegment<
   B extends PipelineBuilder<any, any, any, any, any, any, any>,
   AddedSC extends object,
   AddedVC extends object,
   RequiredAC extends object = {},
   AddedEC extends object = {},
   RequiredIC extends object = {},
   RequiredInjC extends object = {},
   RequiredEC extends object = {},
> =
   B extends PipelineBuilder<
      infer IC,
      infer InjC,
      infer EC,
      infer SC,
      any,
      any,
      infer AC
   >
      ? CompatibleAddition<AC, AddedSC> extends true
         ? CompatibleAddition<AC, AddedVC> extends true
            ? RequiredPresent<AC, RequiredAC> extends true
               ? [keyof AddedEC & Exclude<keyof SC, keyof EC>] extends [never]
                  ? RequiredPresent<IC, RequiredIC> extends true
                     ? RequiredPresent<InjC, RequiredInjC> extends true
                        ? RequiredPresent<EC, RequiredEC> extends true
                           ? B
                           : never // EC missing expression-visible fields required by witness
                        : never // InjC missing injection slots required by witness
                     : never // IC missing initial-input fields required by witness
                  : never // AddedEC would promote a private feature to public
               : never // AC missing required prerequisite fields
            : never
         : never
      : never

/**
 * Describes the PipelineBuilder produced after applying the segment's delta to B.
 * All prior accumulated state in B is preserved via CompatibleMerge.
 *
 * Virtual resolution: names in AddedVC that are already CONCRETE in B's
 * StepContext (SC) are excluded from the result's VirtualContext.  This handles
 * the case where an AddedVC entry was declared as a dep virtual in the blueprint
 * (via addVirtualFeature) but is already concrete in the real builder — it should
 * remain concrete rather than be re-declared as a virtual.
 */
export type AfterSegment<
   B extends PipelineBuilder<any, any, any, any, any, any, any>,
   AddedIC extends object,
   AddedInjC extends object,
   AddedEC extends object,
   AddedSC extends object,
   AddedVC extends object,
   AddedAC extends object,
   AddedSRC extends object,
> =
   B extends PipelineBuilder<
      infer IC,
      infer InjC,
      infer EC,
      infer SC,
      infer VC,
      infer SRC,
      infer AC
   >
      ? PipelineBuilder<
           CompatibleMerge<IC, AddedIC>,
           CompatibleMerge<InjC, AddedInjC>,
           CompatibleMerge<EC, AddedEC>,
           CompatibleMerge<SC, AddedSC>,
           // Virtual resolution:
           // - Drop from VC names that AddedSC is concretizing (segment fulfills them).
           // - Drop from AddedVC names already concrete in SC or being concretized by AddedSC.
           CompatibleMerge<
              Omit<VC, keyof AddedSC>,
              Omit<AddedVC, keyof SC | keyof AddedSC>
           >,
           CompatibleMerge<SRC, AddedSRC>,
           CompatibleMerge<AC, AddedAC>
        >
      : never

// =============================================================================
// Runtime operation record
// =============================================================================

interface AnyMethod {
   method: (...args: any[]) => any
   selectors: ReadonlyArray<string | readonly [string, string]>
}
type AnyProps = Record<string, ExpressionBasedFeature | AnyMethod>

type Operation =
   | { kind: "extendInitial"; name: string; defaults: object }
   | { kind: "addVirtualFeature"; name: string }
   | { kind: "addPublicFeature"; name: string; properties: AnyProps }
   | { kind: "addPrivateFeature"; name: string; properties: AnyProps }
   | { kind: "addStep"; name: string; impl: AnyMethod }
   | { kind: "addPrivateInjection"; name: string }
   | { kind: "addPublicInjection"; name: string }
   | { kind: "addPureFunction"; name: string; fn: (...args: any[]) => unknown }

// =============================================================================
// SegmentBlueprint interface
// =============================================================================

/**
 * Blueprint for constructing typed pipeline segment helper functions.
 *
 * Type parameters track the segment's delta:
 * @typeParam AddedIC     Additions to InitialContext
 * @typeParam AddedInjC   Additions to InjectedContext
 * @typeParam AddedEC     Additions to ExprContext
 * @typeParam AddedSC     Additions to StepContext
 * @typeParam AddedVC     New virtual feature contracts declared by this segment
 * @typeParam AddedAC     Combined AllContext additions (AddedSC ∪ AddedVC)
 * @typeParam KnownAC     AddedAC ∪ RequiredAC — available for internal type-checking
 * @typeParam RequiredAC  Preconditions: must be present in the target builder's AC
 * @typeParam RequiredIC  Fields the witness sourced from InitialContext
 * @typeParam RequiredInjC Fields the witness sourced from InjectedContext
 * @typeParam RequiredEC  Fields the witness exposed to expressions
 * @typeParam AddedSRC    Additions to StepResultContext from addStep calls
 */
export interface SegmentBlueprint<
   AddedIC extends object = {},
   AddedInjC extends object = {},
   AddedEC extends object = {},
   AddedSC extends object = {},
   AddedVC extends object = {},
   AddedAC extends object = {},
   KnownAC extends object = {},
   RequiredAC extends object = {},
   RequiredIC extends object = {},
   RequiredInjC extends object = {},
   RequiredEC extends object = {},
   AddedSRC extends object = {},
> {
   /**
    * Seed a pure function into the expression context.
    *
    * Adds to AddedEC only — pure functions are not selectable by steps and do
    * not appear in AddedSC, AddedAC, or KnownAC.
    *
    * nameOut must be absent from the segment's current AddedEC.
    */
   addPureFunction<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      FnType extends (...args: any[]) => unknown,
      NameOut extends string,
   >(
      nameOut: UnusedKey<AddedEC, NameOut>,
      fn: FnType,
   ): SegmentBlueprint<
      AddedIC,
      AddedInjC,
      WithProp<AddedEC, NameOut, FnType>,
      AddedSC,
      AddedVC,
      AddedAC,
      KnownAC,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   withContextSubject: <SubjectType extends object>() => SegmentContextBuilder<
      SubjectType,
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      AddedVC,
      AddedAC,
      KnownAC,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   /**
    * Produce the typed segment helper function.
    *
    * The parameter type uses `B & BeforeSegment<B,...>` so TypeScript infers `B`
    * from the argument directly, then collapses to `never` if any precondition
    * fails — surfacing the error at the call site rather than downstream.
    */
   buildHelper: () => <
      B extends PipelineBuilder<any, any, any, any, any, any, any>,
   >(
      builder: B &
         BeforeSegment<
            B,
            AddedSC,
            AddedVC,
            RequiredAC,
            AddedEC,
            RequiredIC,
            RequiredInjC,
            RequiredEC
         >,
   ) => AfterSegment<
      B,
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      AddedVC,
      AddedAC,
      AddedSRC
   >
}

// =============================================================================
// SegmentContextBuilder — returned by SegmentBlueprint.withContextSubject<T>()
// =============================================================================

interface SegmentContextBuilder<
   SubjectType extends object,
   AddedIC extends object,
   AddedInjC extends object,
   AddedEC extends object,
   AddedSC extends object,
   AddedVC extends object,
   AddedAC extends object,
   KnownAC extends object,
   RequiredAC extends object,
   RequiredIC extends object,
   RequiredInjC extends object,
   RequiredEC extends object,
   AddedSRC extends object,
> {
   extendInitial: <
      NameOut extends string,
      HasDefaults extends keyof SubjectType = never,
   >(
      nameOut: UnusedKey<KnownAC, NameOut>,
      defaults: Pick<SubjectType, HasDefaults>,
   ) => SegmentBlueprint<
      OptionalWithProp<AddedIC, NameOut, InitialInput<SubjectType, HasDefaults>>,
      AddedInjC,
      WithProp<AddedEC, NameOut, SubjectType>,
      WithProp<AddedSC, NameOut, SubjectType>,
      AddedVC,
      WithProp<AddedAC, NameOut, SubjectType>,
      WithProp<KnownAC, NameOut, SubjectType>,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   addVirtualFeature: <NameOut extends string>(
      nameOut: UnusedKey<KnownAC, NameOut>,
   ) => SegmentBlueprint<
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      WithProp<AddedVC, NameOut, SubjectType>,
      WithProp<AddedAC, NameOut, SubjectType>,
      WithProp<KnownAC, NameOut, SubjectType>,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   addPublicFeature: <
      NameOut extends string,
      Props extends { [K in keyof SubjectType]: LooseFeatureProp } = {
         [K in keyof SubjectType]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<AddedSC, NameOut>,
      properties: ConditionalFeatureProps<
         KnownAC,
         AddedVC,
         NameOut,
         SubjectType,
         SubjectType,
         Props
      >,
   ) => SegmentBlueprint<
      AddedIC,
      AddedInjC,
      WithProp<AddedEC, NameOut, SubjectType>,
      WithProp<AddedSC, NameOut, SubjectType>,
      AddedVC,
      WithProp<AddedAC, NameOut, SubjectType>,
      WithProp<KnownAC, NameOut, SubjectType>,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   addPrivateFeature: <
      NameOut extends string,
      Props extends { [K in keyof SubjectType]: LooseFeatureProp } = {
         [K in keyof SubjectType]: LooseFeatureProp
      },
   >(
      nameOut: UnusedKey<AddedSC, NameOut>,
      properties: ConditionalFeatureProps<
         KnownAC,
         AddedVC,
         NameOut,
         SubjectType,
         SubjectType,
         Props
      >,
   ) => SegmentBlueprint<
      AddedIC,
      AddedInjC,
      AddedEC,
      WithProp<AddedSC, NameOut, SubjectType>,
      AddedVC,
      WithProp<AddedAC, NameOut, SubjectType>,
      WithProp<KnownAC, NameOut, SubjectType>,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   addStep: <
      NameOut extends string,
      NamesIn extends ReadonlyArray<ContextKeysAndPairs<KnownAC>>,
      Params extends CallableParams<KnownAC, NamesIn>,
   >(
      nameOut: UnusedKey<KnownAC, NameOut>,
      implementation: ContextualMethod<KnownAC, SubjectType, NamesIn, Params>,
   ) => SegmentBlueprint<
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      AddedVC,
      AddedAC,
      KnownAC,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      WithProp<AddedSRC, NameOut, SubjectType>
   >

   addPublicInjection: <NameOut extends string>(
      nameOut: UnusedKey<KnownAC, NameOut>,
   ) => SegmentBlueprint<
      AddedIC,
      WithProp<AddedInjC, NameOut, SubjectType>,
      WithProp<AddedEC, NameOut, SubjectType>,
      WithProp<AddedSC, NameOut, SubjectType>,
      AddedVC,
      WithProp<AddedAC, NameOut, SubjectType>,
      WithProp<KnownAC, NameOut, SubjectType>,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >

   addPrivateInjection: <NameOut extends string>(
      nameOut: UnusedKey<KnownAC, NameOut>,
   ) => SegmentBlueprint<
      AddedIC,
      WithProp<AddedInjC, NameOut, SubjectType>,
      AddedEC,
      WithProp<AddedSC, NameOut, SubjectType>,
      AddedVC,
      WithProp<AddedAC, NameOut, SubjectType>,
      WithProp<KnownAC, NameOut, SubjectType>,
      RequiredAC,
      RequiredIC,
      RequiredInjC,
      RequiredEC,
      AddedSRC
   >
}

// =============================================================================
// Implementation
// =============================================================================

function createSegmentBlueprintImpl(ops: Operation[]): any {
   return {
      addPureFunction(name: string, fn: (...args: any[]) => unknown) {
         return createSegmentBlueprintImpl([
            ...ops,
            { kind: "addPureFunction", name, fn },
         ])
      },

      withContextSubject() {
         return {
            extendInitial(name: string, defaults: object) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "extendInitial", name, defaults },
               ])
            },
            addVirtualFeature(name: string) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "addVirtualFeature", name },
               ])
            },
            addPublicFeature(name: string, properties: AnyProps) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "addPublicFeature", name, properties },
               ])
            },
            addPrivateFeature(name: string, properties: AnyProps) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "addPrivateFeature", name, properties },
               ])
            },
            addStep(name: string, impl: AnyMethod) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "addStep", name, impl },
               ])
            },
            addPublicInjection(name: string) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "addPublicInjection", name },
               ])
            },
            addPrivateInjection(name: string) {
               return createSegmentBlueprintImpl([
                  ...ops,
                  { kind: "addPrivateInjection", name },
               ])
            },
         }
      },

      buildHelper() {
         return function (builder: any): any {
            let b: any = builder
            for (const op of ops) {
               switch (op.kind) {
                  case "extendInitial":
                     b = b.extendInitial(op.name, op.defaults)
                     break
                  case "addVirtualFeature":
                     b = b.addVirtualFeature(op.name)
                     break
                  case "addPublicFeature":
                     b = b.addPublicFeature(op.name, op.properties)
                     break
                  case "addPrivateFeature":
                     b = b.addPrivateFeature(op.name, op.properties)
                     break
                  case "addStep":
                     b = b.addStep(op.name, op.impl)
                     break
                  case "addPrivateInjection":
                     b = b.addPrivateInjection(op.name)
                     break
                  case "addPublicInjection":
                     b = b.addPublicInjection(op.name)
                     break
                  case "addPureFunction":
                     b = b.addPureFunction(op.name, op.fn)
                     break
               }
            }
            return b
         }
      },
   }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// =============================================================================
// Factory
// =============================================================================

export function createSegmentBlueprint(): SegmentBlueprint {
   return createSegmentBlueprintImpl([]) as SegmentBlueprint
}

/**
 * Create a SegmentBlueprint whose prerequisite context is derived from an
 * existing PipelineBuilder witness.
 *
 * The witness captures all 6 source-side PipelineBuilder type parameters
 * (IC, InjC, EC, SC, VC, AC), ensuring the real builder sources the same
 * fields via the same mechanism (IC vs injection vs private feature).
 */
export function createSegmentBlueprintFromBuilder<
   IC extends object,
   InjC extends object,
   EC extends object,
   SC extends object,
   _VC extends object,
   _SRC extends object,
   AC extends object,
>(
   _witness: PipelineBuilder<IC, InjC, EC, SC, _VC, _SRC, AC>,
): SegmentBlueprint<{}, {}, {}, {}, {}, {}, AC, SC, IC, InjC, EC, {}> {
   return createSegmentBlueprintImpl([]) as SegmentBlueprint<
      {},
      {},
      {},
      {},
      {},
      {},
      AC,
      SC,
      IC,
      InjC,
      EC,
      {}
   >
}
