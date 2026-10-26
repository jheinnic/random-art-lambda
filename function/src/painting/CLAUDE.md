# RandomArt Painting Layer Architecture

## Layer Role

RandomArt is the **innermost framework layer** — the layer closest to the BullMQ job queue and
the pixel-rendering worker. It owns the FlowProducer, the worker pipeline, and the DTOs that
travel on the wire. It does NOT know or care about the specific application domain (trigrams,
ECDH keys, etc.) that submitted work to it.

## Three-Package Pattern

Every middleware layer in this system has three packages:

- **`spec/`** — the model this layer *receives* as input from the layer above (closer to the app).
  This is what the FlowProducer consumes to produce BullMQ jobs.
- **`sdk/`** — blank base interfaces published as extension points. Callers extend these in their
  own `paint/` packages to contribute domain data. Isolating them here allows both the spec and
  paint models to reference the same extension types without circular dependencies.
- **`dto/`** — the actual BullMQ job payload types (`GatherPaintedPartsRequest`,
  `PartialPaintRequest`, etc.). These are the wire format.

Apps have no `sdk/` package because nothing plugs into an app.

## AppDomainMemento — Opaque Plugin Slot

The RandomArt spec model carries plugin domain data as an opaque nominal string type:

```typescript
declare const _tag: unique symbol
export type AppDomainMemento = string & { readonly [_tag]: void }
```

**Why a memento string rather than a generic type parameter:**
- Intermediate layers (FlowProducer, RandomArt worker pipeline) never need to inspect the
  plugin domain structure. A generic type parameter implies knowledge that doesn't exist.
- Opaque string enforces the blackbox contract structurally — intermediate layers cannot
  accidentally depend on plugin domain fields.
- Version independence: a plugin domain format change affects only the layer that owns it.
- BullMQ JSON-serializes everything anyway; making the boundary explicit is more honest.

The `AppDomainMemento` is produced by `JSON.stringify` at the Permutations → RandomArt
boundary (in PermutationsExpander), cast to the nominal type at that one call site.

## Dehydration Pipeline Segment

The worker pipeline includes a segment that deserializes the memento back into a structured
object and places it under the `app` namespace in the expression context:

```
addPublicFeature("app", {
  // method-form: JSON.parse(appDomain) from initial context
})
```

This gives expression strings access to `app.prefixIndex`, `app.domain.rangeNames`, etc.
The natural nesting of the deserialized structure matches the expression path convention.
No special framework knowledge of the plugin domain type is needed.

## Expression Namespace Convention

Each layer wraps the previous layer's domain under a nested key:
- RandomArt worker places PermutationsPaint under `app`
- PermutationsPaint places app-specific paint under `app.domain`
- So ECDH expressions use `app.domain.rangeNames[app.prefixIndex]`

**Expression rewriting is deferred.** Until implemented, expressions must be written in their
fully-nested final form. The rewriter (when built) will allow each layer to present a flat
namespace to its users and translate at expansion time.

## What Does NOT Belong Here

- Any knowledge of trigram strings, ECDH keys, or other application domains
- `inputEncoding` or `filenameExpression` in the domain memento — these are promoted as
  first-class fields on the spec model, not nested in the opaque plugin slot
- The old `MultiTaskRequestModel<PaintingDomain, ProjectDomain>` generics — the domain
  parameter is now `appDomain: AppDomainMemento`
