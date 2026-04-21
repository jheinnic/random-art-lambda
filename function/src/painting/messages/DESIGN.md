# `src/painting/messages` — RandomArt Workload Message Contract

## Purpose

This package owns all message artifacts for the **RandomArt BullMQ workload**: the DTOs that travel across queue boundaries, the value types those DTOs reference, the codec that transforms them for serialization, and the workload-specific nominal utilities that support that transformation.

It is the RandomArt workload's **application-layer contract**, analogous to what a protobuf or Avro schema file represents in other systems.

The framework-level infrastructure (Envelope, EnvelopeCodec interface, CodecRegistry, Nominal type utilities) lives in `src/messages/`. This package _uses_ that infrastructure but does not own it.

---

## Subdirectory Layout

### `dto/`

Data Transfer Objects: the typed payloads that travel inside BullMQ jobs and flow steps. These are the inputs and outputs of the RandomArt flow processor.

All DTO types are subject to transformation by the `RandomArtCodec` registered under the RandomArt workload identifier. Concretely, this means:
- Fields must use only types the codec knows how to handle
- Nominal types are stripped and must be re-blessed on deserialization
- Class instances that require codec assistance (`CID`, `Uint8ClampedArray`, etc.) are replaced with tagged proxy objects

### `values/`

Value types that appear as fields in DTOs or are used in the processing layer. These carry semantic meaning (e.g. `PaintProjectId`, `PaintTaskId`, `GenModelSeed`) and may be Nominal qualifications of primitives or small plain-object structs.

Types here are either:
- **Nominal primitives** — strings/numbers blessed by the application to assert a constraint (e.g. validated format). The codec must re-bless these on deserialization.
- **Plain structs** — no class instances; survive JSON round-trips without codec intervention.

### `components/` _(needs creation — currently misplaced in `src/messages/components/`)_

RandomArt-workload-specific runtime components (classes and utilities, not type definitions):

| Intended file | Currently at | Notes |
|---|---|---|
| `RandomArtCodec.ts` | `src/messages/components/RandomArtCodec.ts` | The actual codec implementation for this workload. Misplaced; causes the package-level circular dependency between `messages` and `painting/messages`. |
| `NominalUtil.ts` | `src/messages/components/NominalUtil.ts` | Runtime class with static blessing/conversion methods for `PixelsString`, `PixelsData`, `PaintedString`, `PaintedData`, `PaintGeometry`. Depends on `PaintResolution` and `PlotMapGeometry` from this package, so it cannot live in the workload-agnostic framework layer. |

The NestJS DI concern that motivated placing these in `src/messages/` (codec registration may not work via standard NestJS DI) does not require them to live in the same package as the framework infrastructure — it's a module wiring concern that can be addressed by a dedicated NestJS module in `src/modules/` or `src/painting/`.

### `expression/`

Types supporting the **Permutations feature's** interface to the RandomArt workload. Specifically, the four-level filename expression precedence hierarchy and the `ExpressionVisibility` conditional type.

**Status: placement under review.** These are not codec concerns — they are not Nominal qualifications of primitives and do not require codec transformation. They exist at the boundary between:
- The RandomArt workload (which exposes `fileNameExpression` slots in its multi-task project request DTO as black-box `string` fields)
- The Permutations library (which populates those slots during expansion)

The Permutations library is not yet well-isolated in this codebase. Once its boundaries are drawn (likely a `src/permutations/` or `src/painting/permutations/` package), these types should move there or to an explicit interface package at that boundary. For now they remain here as a holding location, pending Permutations isolation.

---

## Relationship to `src/messages/`

```
src/messages/                        (framework — workload-agnostic)
  interface/Nominal.ts               ← Nominal<T,Brand> utility
  interface/NamedValues.ts           ← generic named types (CIDString, ULIDString, WorkloadId…)
  interface/TraceIdentifier.ts       ← OTel trace types
  components/Envelope.ts             ← lifecycle state machine
  components/EnvelopeCodec.ts        ← codec interface
  components/CodecRegistry.ts        ← workload-keyed registry
  …

src/painting/messages/               (RandomArt workload — this package)
  dto/                               ← BullMQ job payloads
  values/                            ← semantic value types for those payloads
  components/                        ← RandomArtCodec + NominalUtil  (TO CREATE)
  expression/                        ← Permutations feature interface (under review)
```

The **package-level circular dependency** between `src/messages` and `src/painting/messages` is caused by `src/messages/interface/NamedValues.ts` importing `PaintResolution` and `PlotMapGeometry` from this package. This happens because several named types in `NamedValues.ts` (`PaintGeometry`, `PixelsString`, `PixelsData`, `PaintedString`, `PaintedData`, and the Affix family) are actually RandomArt-specific and belong here. Moving them here, and moving `NominalUtil` here (which also depends on them), eliminates that import and breaks the cycle.

---

## Misplaced Named Types (currently in `src/messages/interface/NamedValues.ts`)

The following types belong in `src/painting/messages/values/` because they depend on `PaintResolution` or `PlotMapGeometry`:

| Type | Reason it's RandomArt-specific |
|---|---|
| `PaintGeometrySidecar` | references `PaintResolution` |
| `PaintGeometry` | Nominal wrapping of `PlotMapGeometry` |
| `PixelsString` | carries `PaintGeometrySidecar` |
| `PixelsData` | carries `PaintGeometrySidecar` |
| `PaintedString` | carries `PaintGeometrySidecar` |
| `PaintedData` | — |
| `PrefixString/Data`, `SuffixString/Data`, `AnyAffixString/Data` | seed encoding types specific to this workload |

These are pure type definitions and belong in `src/painting/messages/values/`, not `components/`. A new `PaintingNamedValues.ts` (or individual files) should receive them.

The types that legitimately belong in `src/messages/interface/NamedValues.ts` are:
`LiteCIDString`, `CIDString`, `ULIDString`, `WorkloadId`, `ReleaseVersion`, `BuildVersion`

---

## Planned Cleanup Work

1. Create `src/painting/messages/components/`
2. Move `RandomArtCodec.ts` → `src/painting/messages/components/`
3. Move `NominalUtil.ts` → `src/painting/messages/components/`
4. Extract RandomArt-specific named types from `src/messages/interface/NamedValues.ts` → `src/painting/messages/values/PaintingNamedValues.ts`
5. Fix all imports and re-export via index files
6. Verify the package-level circular dependency is eliminated

See the `expression/` section above for the separate Permutations isolation work.
