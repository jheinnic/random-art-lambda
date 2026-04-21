# `src/messages` — Workload-Agnostic Message Exchange Framework

## Purpose

This package provides infrastructure for **serialized message exchange** between application components. It is intentionally **workload-agnostic**: nothing here should know about RandomArt DTOs, painting value types, or any other application domain.

## Problems Addressed

### 1. Nominal Type Provenance Across Serialization Boundaries

Application code uses Nominal types to mark that a semantic validation constraint has been met (e.g. a string has been confirmed to be a valid ULID, or a CID has been verified). Serialization strips those type-level assertions. Deserialization must re-assert them, or downstream consumers cannot safely rely on the Nominal type.

### 2. Non-Trivially-Serializable Value Classes

Some value objects are conceptually safe to exchange across a serialization boundary but do not have built-in `toString()`/`fromString()` codec pairings that integrate seamlessly with `JSON.stringify`/`JSON.parse`. The Envelope+Codec pattern provides a consistent hook to handle these.

### 3. Referential Integrity (Multiple Paths / Cycles)

Default JSON serialization:
- Loses the identity of objects referenced via multiple paths in the containment tree (produces duplicates on deserialization)
- Refuses to serialize object graphs containing cycles

The Envelope intends to address this by tracking object identity during traversal and replacing subsequent encounters of the same object with a pure-metadata proxy. **This is not yet implemented** — proxy serialization is a planned future capability.

### 4. Cross-Version Compatibility

The root of every serialization-friendly message form includes a meta-information key specifying the origin workload ID and version. Future codec registrations can include transformation logic to interface with any supported earlier release of the same workload. **Not yet exercised in practice.** The design targets backwards-compatible server-side exchanges only: the recipient is expected to be upgraded before its sender.

### 5. Distributed Tracing Header Management

The `Envelope` lifecycle methods (`createMessage`, `startReplying`, `commitBody`) serve as attachment points for OTel instrumentation and manage the header content required to carry trace context across serialization boundaries.

---

## Components

### `interface/`

Generic, workload-neutral types:

| File | Contents |
|---|---|
| `Nominal.ts` | `Nominal<T, Brand>` type utility |
| `NamedValues.ts` | Generic named types: `CIDString`, `LiteCIDString`, `ULIDString`, `WorkloadId`, `ReleaseVersion`, `BuildVersion` |
| `TraceIdentifier.ts` | Distributed tracing correlation types |

**Rule:** `NamedValues.ts` must not import from any workload-specific package (e.g. `painting/messages/`). Named types that depend on RandomArt value types belong in `painting/messages/values/`.

### `components/`

Infrastructure classes:

| File | Role |
|---|---|
| `Envelope.ts` | State-machine wrapper for message lifecycle (see below) |
| `EnvelopeCodec.ts` | Interface a workload codec must implement |
| `CodecRegistry.ts` | Registry of codecs keyed by workload identifier |
| `MessageLifecycle.ts` | Lifecycle state enum |
| `Header.ts` | Typed message header structure |
| `ReleaseVersion.ts` | Workload version value type |
| `SeedEncodingUtil.ts` | Lightweight seed encoding (no canvas dependency) |

**Not here:** Workload-specific codecs (`RandomArtCodec`) and workload-specific nominal utilities (`NominalUtil`) belong in `painting/messages/components/`.

---

## Envelope Lifecycle

The `Envelope` class uses an internal state machine. A payload progresses through four states:

```
APP_OBJECT_GRAPH              (provided by application for sending)
        │  encode()
        ▼
SERIALIZATION_FRIENDLY_OUTBOUND   (JSON-safe; passed to transport)
        │  (transport serializes / deserializes)
        ▼
SERIALIZATION_FRIENDLY_INBOUND    (JSON-safe; received from transport)
        │  decode()
        ▼
APP_OBJECT_GRAPH              (returned to receiving application)
```

The Envelope does not perform transformation itself. It delegates to a workload `EnvelopeCodec<T>` looked up from the `CodecRegistry` by workload identifier. Moving from one state to the next creates a new Envelope object (immutable progression).

The codec receives a recursive walk of the payload tree and may "handle" any node by replacing it; replacements are tagged with a `__t` type label and are pruned from further recursion.

---

## Workload Scope

A **workload** is scoped to the set of DTOs forming a single application contract, such that both the sending and receiving sides share the required TypeScript classes and types. Each workload registers its codec against its workload identifier.

---

## Planned Future Work

- Proxy-based referential integrity (deduplication and cycle support)
- BullMQ Flow async messaging patterns in `Envelope` (currently only sync call/response is covered)
