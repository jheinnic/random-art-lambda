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
//
// Usage:
//
//   export function createEncodingSegment(configSvc: ConfigService) {
//     const defaultEncoding =
//       configSvc.get<BufferEncoding>("encoding.default") ?? "utf8"
//     return createSegmentBlueprint()
//       .extendInitial({ originalEncoding: defaultEncoding })
//       .addVirtualFeature<EncodingOverride, "encodingOverride">("encodingOverride")
//       .buildHelper()
//   }
//
//   export function createWorkerPoolSegment(_configSvc: ConfigService) {
//     return createSegmentBlueprint()
//       .addVirtualDependency<IFileStore, "fileStore">()     // dep — must be concrete in real builder
//       .addVirtualDependency<Buffer, "canvasBuffer">()      // dep — must be concrete in real builder
//       .addVirtualFeature<FileStoreSelection, "stagingStrategy">("stagingStrategy")
//       .addVirtualFeature<PathTargetSelection, "stagedFilePath">("stagedFilePath")
//       .addStep("stagingResult", { method: ..., selectors: [...] })
//       .buildHelper()
//   }

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
   UnusedKey,
   WithProp,
   CompatibleForMixin,
   InitialInput,
   ContextKeysAndPairs,
} from "./types.js"
import type {
   IBasePipelineBuilder,
   PipelineBuilder,
   ContextualMethod,
   PropertySelectorsMap,
   FeatureProperties,
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
   keyof Addition & keyof Existing,
] extends [never]
   ? true
   : [
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
] extends [never]
   ? true
   : [keyof Required] extends [keyof AC]
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
 *
 * Evaluates to B itself when all constraints pass, or `never` on any violation.
 * Applied as the type of the `builder` parameter in the generated helper function,
 * so violations surface as type errors at the call site.
 */
export type BeforeSegment<
   B extends PipelineBuilder,
   AddedSC extends object,
   AddedVC extends object,
   RequiredAC extends object = {},
> =
   B extends PipelineBuilder<any, any, any, any, any, infer AC>
      ? CompatibleAddition<AC, AddedSC> extends true
         ? CompatibleAddition<AC, AddedVC> extends true
            ? RequiredPresent<AC, RequiredAC> extends true
               ? B
               : never
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
   B extends PipelineBuilder,
   AddedIC extends object,
   AddedInjC extends object,
   AddedEC extends object,
   AddedSC extends object,
   AddedVC extends object,
   AddedAC extends object,
> =
   B extends PipelineBuilder<
      infer IC,
      infer InjC,
      infer EC,
      infer SC,
      infer VC,
      infer AC
   >
      ? PipelineBuilder<
           CompatibleMerge<IC, AddedIC>,
           CompatibleMerge<InjC, AddedInjC>,
           CompatibleMerge<EC, AddedEC>,
           CompatibleMerge<SC, AddedSC>,
           // Virtual resolution: skip names already concrete in the real builder's SC.
           CompatibleMerge<VC, Omit<AddedVC, keyof SC>>,
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
type AnyProps = Record<string, string | readonly [string] | AnyMethod>

type Operation =
   | { kind: "extendInitial"; defaults: object }
   | { kind: "addVirtualFeature"; name: string }
   | { kind: "addPublicFeature"; name: string; properties: AnyProps }
   | { kind: "addPrivateFeature"; name: string; properties: AnyProps }
   | { kind: "addStep"; name: string; impl: AnyMethod }
   | { kind: "addPrivateInjection"; name: string }
   | { kind: "addPublicInjection"; name: string }

// =============================================================================
// SegmentBlueprint interface
// =============================================================================

/**
 * Blueprint for constructing typed pipeline segment helper functions.
 *
 * Extends IBasePipelineBuilder so the shared operation vocabulary (extendInitial,
 * addVirtualFeature, addPublicFeature, addPrivateFeature, addStep,
 * addPrivateInjection) is declared once on the base and inherited here with
 * SegmentBlueprint-specific return types.
 *
 * Call buildHelper() to produce the typed helper function.  All `as any` usage
 * is encapsulated in the factory function implementation site.
 *
 * Type parameters track the segment's delta:
 * @typeParam AddedIC    Additions to InitialContext
 * @typeParam AddedInjC  Additions to InjectedContext
 * @typeParam AddedEC    Additions to ExprContext
 * @typeParam AddedSC    Additions to StepContext
 * @typeParam AddedVC    New virtual feature contracts declared by this segment
 * @typeParam AddedAC    Combined AllContext additions (AddedSC ∪ AddedVC)
 * @typeParam KnownAC    AddedAC ∪ RequiredAC — available for internal type-checking
 * @typeParam RequiredAC Preconditions: must be present in the target builder's AC
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
> extends IBasePipelineBuilder {
   extendInitial<
      Extra extends object,
      ExtraDefaults extends Partial<Extra> = Partial<Extra>,
   >(
      defaults: ExtraDefaults,
   ): [CompatibleForMixin<AddedSC, Extra>] extends [never]
      ? never
      : SegmentBlueprint<
           CompatibleMerge<AddedIC, InitialInput<Extra, ExtraDefaults>>,
           AddedInjC,
           CompatibleMerge<AddedEC, Extra>,
           CompatibleMerge<AddedSC, Extra>,
           AddedVC,
           CompatibleMerge<AddedAC, Extra>,
           CompatibleMerge<KnownAC, Extra>,
           RequiredAC
        >

   addVirtualFeature<VType extends object, NameOut extends string>(
      nameOut: UnusedKey<KnownAC, NameOut>,
   ): SegmentBlueprint<
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      WithProp<AddedVC, NameOut, VType>,
      WithProp<AddedAC, NameOut, VType>,
      WithProp<KnownAC, NameOut, VType>,
      RequiredAC
   >

   addPublicFeature<
      ExprOut extends object,
      NameOut extends string,
      Sel extends PropertySelectorsMap<KnownAC, ExprOut> = Record<never, never>,
   >(
      nameOut: UnusedKey<KnownAC, NameOut>,
      properties: FeatureProperties<KnownAC, ExprOut, Sel>,
   ): SegmentBlueprint<
      AddedIC,
      AddedInjC,
      WithProp<AddedEC, NameOut, ExprOut>,
      WithProp<AddedSC, NameOut, ExprOut>,
      AddedVC,
      WithProp<AddedAC, NameOut, ExprOut>,
      WithProp<KnownAC, NameOut, ExprOut>,
      RequiredAC
   >

   addPrivateFeature<
      ExprOut extends object,
      NameOut extends string,
      Sel extends PropertySelectorsMap<KnownAC, ExprOut> = Record<never, never>,
   >(
      nameOut: UnusedKey<KnownAC, NameOut>,
      properties: FeatureProperties<KnownAC, ExprOut, Sel>,
   ): SegmentBlueprint<
      AddedIC,
      AddedInjC,
      AddedEC,
      WithProp<AddedSC, NameOut, ExprOut>,
      AddedVC,
      WithProp<AddedAC, NameOut, ExprOut>,
      WithProp<KnownAC, NameOut, ExprOut>,
      RequiredAC
   >

   addStep<
      StepOut extends object,
      NameOut extends string,
      NamesIn extends ReadonlyArray<ContextKeysAndPairs<KnownAC>>,
   >(
      nameOut: UnusedKey<KnownAC, NameOut>,
      implementation: ContextualMethod<KnownAC, StepOut, NamesIn>,
   ): SegmentBlueprint<
      AddedIC,
      AddedInjC,
      [keyof StepOut] extends [never]
         ? AddedEC
         : WithProp<AddedEC, NameOut, StepOut>,
      [keyof StepOut] extends [never]
         ? AddedSC
         : WithProp<AddedSC, NameOut, StepOut>,
      AddedVC,
      [keyof StepOut] extends [never]
         ? AddedAC
         : WithProp<AddedAC, NameOut, StepOut>,
      [keyof StepOut] extends [never]
         ? KnownAC
         : WithProp<KnownAC, NameOut, StepOut>,
      RequiredAC
   >

   addPrivateInjection<InjectedType, NameOut extends string>(
      nameOut: UnusedKey<KnownAC, NameOut>,
   ): SegmentBlueprint<
      AddedIC,
      WithProp<AddedInjC, NameOut, InjectedType>,
      AddedEC,
      WithProp<AddedSC, NameOut, InjectedType>,
      AddedVC,
      WithProp<AddedAC, NameOut, InjectedType>,
      WithProp<KnownAC, NameOut, InjectedType>,
      RequiredAC
   >

   /**
    * Produce the typed segment helper function.
    *
    * The parameter type is `B` so TypeScript can infer `B` directly from the
    * argument.  The return type threads `B` through `BeforeSegment<B,...>` first:
    *   - When preconditions and uniqueness checks pass, BeforeSegment<B,...> = B,
    *     so the return is AfterSegment<B,...> — the fully accumulated type.
    *   - When any check fails, BeforeSegment<B,...> = never,
    *     so AfterSegment<never,...> = never, breaking the chain immediately.
    *
    * Errors surface on the variable receiving the result (or the next segment
    * call that receives `never`), rather than on the argument.
    *
    * All `as any` usage is encapsulated in the factory function — segment
    * developers never write unsafe casts.
    */
   buildHelper: () => <B extends PipelineBuilder<any, any, any, any, any, any>>(
      builder: B,
   ) => AfterSegment<
      BeforeSegment<B, AddedSC, AddedVC, RequiredAC>,
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      AddedVC,
      AddedAC
   >
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Factory function producing SegmentBlueprint runtime objects.
 * Mirrors the createBuilderImpl factory pattern in core.ts.
 *
 * Returns a plain object with all SegmentBlueprint methods attached.
 * Cast to SegmentBlueprint<> happens once at the createSegmentBlueprint()
 * public boundary.
 */
function createSegmentBlueprintImpl(ops: Operation[]): any {
   return {
      extendInitial(defaults: object) {
         return createSegmentBlueprintImpl([
            ...ops,
            { kind: "extendInitial", defaults },
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

      addPrivateInjection(name: string) {
         return createSegmentBlueprintImpl([
            ...ops,
            { kind: "addPrivateInjection", name },
         ])
      },

      addPublicInjection(name: string) {
         return createSegmentBlueprintImpl([
            ...ops,
            { kind: "addPublicInjection", name },
         ])
      },

      buildHelper() {
         return function (builder: any): any {
            let b: any = builder
            for (const op of ops) {
               switch (op.kind) {
                  case "extendInitial":
                     b = b.extendInitial(op.defaults)
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

/**
 * Create a fresh SegmentBlueprint for constructing a typed pipeline segment
 * helper function.
 *
 * @example
 * export function createEncodingSegment(configSvc: ConfigService) {
 *   const defaultEncoding =
 *     configSvc.get<BufferEncoding>("encoding.default") ?? "utf8"
 *   return createSegmentBlueprint()
 *     .extendInitial({ originalEncoding: defaultEncoding })
 *     .addVirtualFeature<EncodingOverride, "encodingOverride">("encodingOverride")
 *     .buildHelper()
 * }
 */
export function createSegmentBlueprint(): SegmentBlueprint {
   // Single cast: the factory returns a plain object typed as any;
   // SegmentBlueprint<> is the typed facade visible to segment developers.
   return createSegmentBlueprintImpl([]) as SegmentBlueprint
}

/**
 * Create a SegmentBlueprint whose prerequisite context is derived from an
 * existing PipelineBuilder witness.
 *
 * The witness is a PipelineBuilder that has been advanced through the same
 * segment directors this new segment will depend on — it acts purely as a
 * type-level proof that those prerequisites are concrete.  Its runtime value
 * is discarded; only the type parameters are extracted.
 *
 * This separates prerequisite declaration from addition declaration:
 * - Prerequisites: expressed structurally via the witness builder chain
 * - Additions:     expressed via the returned SegmentBlueprint's methods
 *
 * The resulting SegmentBlueprint's BeforeSegment check will require the real
 * builder to have at least the concrete context of the witness's StepContext,
 * and will have access to AllContext (including virtuals) for selector
 * type-checking within the new segment's declarations.
 *
 * @example
 * export function createWorkerPoolSegment(configSvc: ConfigService) {
 *   // Witness chain: advance a minimal builder through prerequisites
 *   const prereqs = createPermutationSegment(configSvc)(
 *     createEncodingSegment(configSvc)(
 *       createPipeline<{ prefix: Uint8ClampedArray; suffix: Uint8ClampedArray; canvasBuffer: Buffer }>()
 *         .addPrivateInjection<IFileStore, "fileStore">("fileStore")
 *     )
 *   )
 *   // Blueprint: declare only the additions this segment contributes
 *   return createSegmentBlueprintFromBuilder(prereqs)
 *     .addVirtualFeature<FileStoreSelection, "stagingStrategy">("stagingStrategy")
 *     .addVirtualFeature<PathTargetSelection, "stagedFilePath">("stagedFilePath")
 *     .addStep("stagingResult", { ... })
 *     .buildHelper()
 * }
 */
export function createSegmentBlueprintFromBuilder<
   _IC extends object,
   _InjC extends object,
   _EC extends object,
   SC extends object,
   _VC extends object,
   AC extends object,
>(
   _witness: PipelineBuilder<_IC, _InjC, _EC, SC, _VC, AC>,
): SegmentBlueprint<{}, {}, {}, {}, {}, {}, AC, SC> {
   return createSegmentBlueprintImpl([]) as SegmentBlueprint<
      {},
      {},
      {},
      {},
      {},
      {},
      AC,
      SC
   >
}
