# Permutations Layer Architecture

## Layer Role

Permutations is a **middleware layer** between application-specific expanders (Trigram, ECDH,
etc.) and the RandomArt worker framework. It owns the logic for expanding a set of term pairs
and region maps into a flat list of painting tasks, tracking indices, and encoding terms into
the base64url format the RandomArt rendering engine expects.

Permutations does NOT know or care about the specific meaning of the terms it expands — whether
they are trigrams, key bit ranges, or anything else.

## Three-Package Pattern

- **`spec/`** — what the PermutationsExpander receives. Includes `inputEncoding` (explicit here,
  since Permutations accepts configurable encoding; apps that fix their encoding set it in their
  own expander). Carries the app-specific paint model in an extension slot typed as
  `PermutationTaskDomain`.
- **`sdk/`** — blank base interfaces:
  - `PermutationTaskDomain` — extended by app paint models (e.g., ECDHPaint). Trigram extends
    nothing because it contributes no app-specific domain data.
  - `PermutationProjectDomain` — extended by app project-level paint models.
- **`paint/`** — what PermutationsExpander produces to hand to RandomArt:
  - `PermutationTaskPaint extends WorkerTaskDomain` (from RandomArt SDK)
  - Carries: `prefixIndex`, `suffixIndex`, `termPairIndex`, `termPairSourceIndex`, encoded term
    strings, and a `domain: PermutationTaskDomain` slot carrying the app's paint contribution.

## Promoted Fields

`inputEncoding` and `filenameExpression` are **not** nested inside `PermutationTaskPaint.domain`.
They travel as first-class fields through the spec models and are placed at the top level of the
RandomArt spec model. The EncodingSegment in the worker pipeline reads `inputEncoding` directly
from the top-level context, not from any nested domain object.

This is the rule: any value that a higher layer needs to act on directly (not just carry through)
must be promoted to a first-class field on that layer's spec model. Only opaque pass-through
state belongs in the domain extension slot.

## Serialization Boundary

PermutationsExpander serializes `PermutationTaskPaint` (including any nested app domain) to an
`AppDomainMemento` string before handing it to the RandomArt FlowProducer. This is the one place
`JSON.stringify` is called on the plugin domain. RandomArt carries the string opaquely from that
point forward.

## Expression Namespace

In the worker's expression context, `PermutationTaskPaint` appears under `app`:
- `app.prefixIndex`, `app.suffixIndex`, `app.termPairIndex`, `app.termPairSourceIndex`
- `app.domain` — the deserialized app-specific paint contribution (ECDH, etc.)

Trigram's `app.domain` is absent/empty because Trigram has no paint model.

## Version Independence

If the Permutations spec model gains a new feature, a forward converter from the old spec to
the new spec is released alongside the new version. Application expanders targeting the old spec
continue working — they still expand to the old PermutationsSpec, and the backward-compatible
receiver upgrades it. This is why applications must NOT expand directly to RandomArtSpec,
bypassing the Permutations layer.
