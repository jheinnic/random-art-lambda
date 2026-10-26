# Pipeline Framework — Notes for Claude

## Overview

`src/pipeline/` is a typed, fluent pipeline builder framework. Two entry points:

- **`createPipeline<IC>()`** — start a fresh `PipelineBuilder` seeded with initial-context type `IC`
- **`createSegmentBlueprint()`** / **`createSegmentBlueprintFromBuilder(witness)`** — build a reusable segment helper that can be applied to any compatible builder

Public exports live in `src/pipeline/index.ts`.

---

## The `withContextSubject<T>()` pattern

**Neither `PipelineBuilder` nor `SegmentBlueprint` exposes feature/step/injection methods directly.**
They are only reachable after calling `.withContextSubject<T>()`, which returns a `PipelineContextBuilder<T, ...>` / `SegmentContextBuilder<T, ...>`. `T` (the *subject type*) is carried in the context-builder's type, so methods like `addVirtualFeature`, `addPublicFeature`, `addStep` need no explicit type arguments — TypeScript infers everything from the argument.

```typescript
// PipelineBuilder — full pipeline assembly
createPipeline<MyInitial>()
  .withContextSubject<SomeFeatureType>()
  .addPublicFeature("featureName", { prop: "expr" })   // SomeFeatureType inferred
  .withContextSubject<AnotherType>()
  .addVirtualFeature("slotName")                        // AnotherType inferred
  .buildPipeline({ result: ["featureName", "prop"] })

// SegmentBlueprint — reusable segment definition
createSegmentBlueprint()
  .withContextSubject<OutputType>()
  .addPublicFeature("name", { ... })
  .buildHelper()
```

**Exceptions** — methods that stay directly on `SegmentBlueprint` (no subject type needed):
- `withContextSubject<T>()` — the entry point
- `addPureFunction(name, fn)` — a constant function value; no output type to carry
- `buildHelper()` — finalizes the blueprint

---

## `PipelineBuilder` type-parameter order

```
PipelineBuilder<
  InitialContext,    // 1 — fields the caller supplies at runtime
  InjectedContext,   // 2 — fields supplied by DI injections
  ExprContext,       // 3 — public subset visible to expression strings
  StepContext,       // 4 — full concrete context available to steps
  VirtualContext,    // 5 — declared-but-unbound virtual contracts
  StepResultContext, // 6 — outputs from addStep calls (isolated from features)
  AllContext,        // 7 — Mixin<StepContext, VirtualContext>
>
```

**`StepResultContext` is position 6, `AllContext` is position 7.** This tripped up `segment.ts` and `core.ts` during a refactor — `BeforeSegment`, `AfterSegment`, and `createSegmentBlueprintFromBuilder` all use positional `infer` on `PipelineBuilder` and must reflect this order.

`buildPipeline` result selectors address `Mixin<ExprContext, StepResultContext>` — public features plus step outputs. Steps cannot read each other's outputs; features cannot read step outputs.

---

## Segment witness pattern

`createSegmentBlueprintFromBuilder(witness)` takes a `PipelineBuilder` that has been advanced through all of the segment's prerequisites. The type parameters of that witness become `RequiredIC`, `RequiredInjC`, `RequiredEC`, `RequiredAC` (i.e., the checks the generated helper enforces at its call site). The witness itself is discarded at runtime — it is used only for its type.

```typescript
// Minimal witness: advance through all dependencies
const witness = createEncodingSegment(createArtworkEngineSegment(createPipeline()))

const myBlueprint = createSegmentBlueprintFromBuilder(witness)
  .withContextSubject<MyOutputType>()
  .addPublicFeature("myFeature", { ... })

export type MySegmentHelper = ReturnType<typeof myBlueprint.buildHelper>
export const createMySegment: MySegmentHelper = myBlueprint.buildHelper()
```

`buildHelper()` returns a function `(builder: B & BeforeSegment<B, ...>) => AfterSegment<B, ...>`. `BeforeSegment` collapses to `never` if any precondition fails, surfacing the error at the call site.

---

## `buildHelper` replay and runtime backward compat

`buildHelper()` replays recorded operations onto the real builder using `b: any`, calling flat methods like `b.addVirtualFeature(name)` directly. `PipelineBuilder`'s TypeScript interface no longer declares these flat methods (they are only accessible via `withContextSubject()`), but the **runtime object** returned by `createBuilderImpl` in `core.ts` still has them as own properties — because `withContextSubject()` returns `this`.

This means: do not remove the flat methods from the object literal in `core.ts`; only the TypeScript *interface* (`PipelineBuilder`) omits them.

---

## `SegmentContextBuilder` vs `PipelineContextBuilder`

Both expose the same vocabulary (`extendInitial`, `addVirtualFeature`, `addPublicFeature`, `addPrivateFeature`, `addStep`, `addPublicInjection`, `addPrivateInjection`). The difference:

- `PipelineContextBuilder` methods return `PipelineBuilder<...>`
- `SegmentContextBuilder` methods return `SegmentBlueprint<...>` (tracking the segment's delta)

`SegmentContextBuilder` does **not** have `addPureFunction` or `buildHelper` — those remain on `SegmentBlueprint` itself.

---

## Feature property types (`builder.ts`)

| Type | Role |
|------|------|
| `LooseFeatureProp` | Upper bound for `Props` inference — accepts any valid form without checking |
| `CheckProp<Context, PropType, Prop>` | Validates one property: method-form checks `CallableParams`; non-method form accepts `string \| readonly [string]` |
| `CheckFeatureProps<Context, ExprOut, Props>` | Validates all properties; extra keys (not in `ExprOut`) map to `never` |
| `ConditionalFeatureProps<...>` | Guards virtual fulfillment: if `NameOut` is a declared virtual, `CombinedOut` must bidirectionally satisfy it |

`CheckProp`'s non-method branch returns `string | readonly [string]` (not the original `Prop` type). This means a `Props` widened to `LooseFeatureProp` will collide — use `withContextSubject<T>()` so `Props` is freely inferred and never widened.

---

## `ContextualMethod<Context, ReturnedType, ParamSelectors, Params>`

The 4th type parameter `Params` defaults to `CallableParams<Context, ParamSelectors>`. Declaring it explicitly allows TypeScript to use the constraint as a *contextual type* for method parameters, enabling unannotated method params inferred from selectors.

```typescript
// selectors drive method param types — no annotations needed on method
.addStep("result", {
  method: async (store, path, canvas) => { ... },  // types inferred from selectors
  selectors: [["injection", "store"], "path", "canvas"] as const,
})
```

---

## `addStep` selector comment pattern

In segment blueprints, the `selectors` array serves double duty: its **type** drives `CallableParams` inference (fixing method parameter types), while the **runtime values** are recorded and replayed by `buildHelper`. In some segments the comment `// Used only for type extraction — runtime value is discarded` appears on selectors whose values will be overridden by application-level configuration.

---

## Key files

| File | Purpose |
|------|---------|
| `src/pipeline/builder.ts` | `PipelineBuilder`, `PipelineContextBuilder`, `PipelineSplitContextBuilder` interfaces + feature-prop types |
| `src/pipeline/core.ts` | Runtime implementation of `PipelineBuilder`; `createPipeline<IC>()` |
| `src/pipeline/segment.ts` | `SegmentBlueprint`, `SegmentContextBuilder`, `BeforeSegment`, `AfterSegment`; `createSegmentBlueprint()`, `createSegmentBlueprintFromBuilder()` |
| `src/pipeline/types.ts` | Shared type utilities: `Mixin`, `WithProp`, `UnusedKey`, `CallableParams`, `ContextKeysAndPairs`, etc. |
| `src/pipeline/runtime.ts` | Internal stage descriptors used by `core.ts` at execution time |
| `src/painting/pipeline/components/` | Application segments: `ArtworkEngineSegment`, `EncodingSegment`, `WorkerPoolSegment` |
| `src/painting/pipeline/components/Testy.ts` | **User WIP / observation file** — temporary type-system experiments, not production code |
