// =============================================================================
// SegmentBlueprint — typed pipeline segment helper factory
// =============================================================================
//
// Usage:
//
//   export function createEncodingSegment(configSvc: ConfigService) {
//     const defaultEncoding = configSvc.get<BufferEncoding>("encoding.default") ?? "utf8"
//     return createSegmentBlueprint()
//       .extendInitial({ originalEncoding: defaultEncoding })
//       .addVirtualFeature<EncodingOverride, "encodingOverride">("encodingOverride")
//       .buildHelper()
//   }
//
// The returned function has the signature:
//   <B extends PipelineBuilder>(builder: BeforeSegment<B,...>) => AfterSegment<B,...>
//
// All `as any` usage is encapsulated inside buildHelper()'s implementation.
// Segment developers never write unsafe casts.

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
   UnusedKey,
   WithProp,
   CompatibleForMixin,
   ContextKeysAndPairs,
} from "./types.js"
import type {
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
 *
 * Uses tuple-wrapped non-distributive extends throughout to prevent
 * union short-circuiting.
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
           CompatibleMerge<VC, AddedVC>,
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
 * Shares PipelineBuilder's method vocabulary but operates on a fresh empty
 * context, so every TypeScript conditional type check (UnusedKey,
 * CompatibleForMixin, etc.) evaluates on concrete types without unconstrained
 * generics.
 *
 * Call buildHelper() to produce the typed helper function; all `as any`
 * usage is encapsulated in that one implementation site.
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
> {
   /**
    * Declare that the target builder must have the given context shape before
    * the helper is called.  Also makes those properties available for
    * type-checking within subsequent blueprint calls (step selectors, etc.).
    *
    * Pure type-level declaration; no runtime effect.
    */
   requiresInContext<Required extends object>(): SegmentBlueprint<
      AddedIC,
      AddedInjC,
      AddedEC,
      AddedSC,
      AddedVC,
      AddedAC,
      CompatibleMerge<KnownAC, Required>,
      CompatibleMerge<RequiredAC, Required>
   >

   extendInitial<Extra extends object>(
      defaults: CompatibleForMixin<AddedSC, Extra>,
   ): SegmentBlueprint<
      CompatibleMerge<AddedIC, Extra>,
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
    * Errors therefore surface on the variable receiving the result (or on the
    * next segment call that receives `never`), rather than on the argument.
    *
    * All `as any` usage is encapsulated here — segment developers never write
    * unsafe casts.
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

// SegmentBlueprintImpl deliberately does NOT declare `implements SegmentBlueprint`.
// The typed interface uses deeply nested conditional types that TypeScript cannot
// verify against an erased implementation.  The cast to SegmentBlueprint<> happens
// once at the createSegmentBlueprint() factory boundary below.
class SegmentBlueprintImpl {
   constructor(private readonly ops: Operation[] = []) {}

   requiresInContext(): SegmentBlueprintImpl {
      return this // pure type-level; no runtime state change
   }

   extendInitial(defaults: object): SegmentBlueprintImpl {
      return new SegmentBlueprintImpl([
         ...this.ops,
         { kind: "extendInitial", defaults },
      ])
   }

   addVirtualFeature(name: string): SegmentBlueprintImpl {
      return new SegmentBlueprintImpl([
         ...this.ops,
         { kind: "addVirtualFeature", name },
      ])
   }

   addPublicFeature(name: string, properties: AnyProps): SegmentBlueprintImpl {
      return new SegmentBlueprintImpl([
         ...this.ops,
         { kind: "addPublicFeature", name, properties },
      ])
   }

   addPrivateFeature(name: string, properties: AnyProps): SegmentBlueprintImpl {
      return new SegmentBlueprintImpl([
         ...this.ops,
         { kind: "addPrivateFeature", name, properties },
      ])
   }

   addStep(name: string, impl: AnyMethod): SegmentBlueprintImpl {
      return new SegmentBlueprintImpl([
         ...this.ops,
         { kind: "addStep", name, impl },
      ])
   }

   addPrivateInjection(name: string): SegmentBlueprintImpl {
      return new SegmentBlueprintImpl([
         ...this.ops,
         { kind: "addPrivateInjection", name },
      ])
   }

   buildHelper() {
      const ops = this.ops
      // This is the single `as any` bridge in the entire framework.
      // `builder` arrives as BeforeSegment<B,...> — a concrete B at the call site.
      // We replay the recorded operations, which mirror exactly what the developer
      // declared on the blueprint.  The result is cast to AfterSegment<B,...>,
      // which is provably correct because AfterSegment is derived from the same
      // declarations the blueprint accumulated.
      return function <B extends PipelineBuilder>(builder: any): any {
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
   }
}

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
   // Single cast: SegmentBlueprintImpl is the untyped runtime carrier;
   // SegmentBlueprint<> is the typed facade visible to segment developers.
   return new SegmentBlueprintImpl() as unknown as SegmentBlueprint
}
