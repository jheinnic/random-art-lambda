# Trigram Permutation App Architecture

## Layer Role

Trigram Permutation is an **application layer** — the outermost layer, closest to the end user.
It accepts user-authored project specs (JSON), expands them into painting tasks via the
Permutations middleware layer, and submits them to RandomArt for rendering.

Trigram is the simplest possible application built on Permutations: it fixes `inputEncoding`
to `"utf-8"` and otherwise passes through the Permutations semantics directly to its users.

## No Paint Model

Trigram has **no `paint/` package**. It contributes no application-specific domain data to the
expression context beyond what Permutations already provides (indices, encoded terms).

The human-readable trigram strings (`prefixTrigram`, `suffixTrigram`) are NOT stored in any
paint model. They are derived at pipeline evaluation time: the EncodingSegment uses
`inputEncoding: "utf-8"` to produce transcoding utilities that recover the original UTF-8
strings from the base64url-encoded `seedPrefix`/`seedSuffix` in the `genSeed`.

The old `models/paint/TrigramPaintTask` (with `prefixTrigram`, `suffixTrigram`, indices,
`inputEncoding`, `resolvedFileNameExpression`) was wrong on multiple counts:
- Indices belong to `PermutationTaskPaint`, not to any app paint model
- Human-readable strings are derived, not stored
- `inputEncoding` and `filenameExpression` travel through spec models, not paint models
- Trigram contributes no app-specific domain data at all

## TrigramExpander is Nearly a No-Op

Today the TrigramExpander does:
1. Set `inputEncoding: "utf-8"` on the PermutationsSpec
2. Map `TrigramProjectSpec` fields to `PermutationsSpec` fields

**Future role (expression rewriting deferred):** The TrigramExpander will eventually:
- Re-expose Permutations expression identifiers under Trigram-owned aliases, presenting a flat
  namespace to Trigram users that hides the `app.` prefix
- Rewrite shorthand expressions (e.g., `${prefixTrigram}`) into the canonical form the
  Permutations layer expects (e.g., `${app.prefixTerm}`) before yielding to Permutations

Until expression rewriting is implemented, expressions must be written in their fully-nested
final form (`app.prefixIndex`, etc.).

## Spec Model (models/spec/)

The spec model is the user-facing input. It should be clean and free of RandomArt internals:
- `TrigramProjectSpec` — project id, region map catalog, permutation specs, optional
  `fileNameExpression`
- `PrefixSuffixSpec`, `AllPairsSpec` — permutation type specs with term lists and region map
  names; optional `fileNameExpression` override per permutation group
- No `inputEncoding` field — Trigram dictates UTF-8 universally
- No `ExpressionVisibility` generics — these were artifacts of an abandoned pipeline design

## Expression Context Available to Trigram Users

Via the Permutations layer (under `app.*`):
- `app.prefixIndex`, `app.suffixIndex` — ordinal of each term in its source list
- `app.termPairIndex` — ordinal of this pair within its permutation group
- `app.termPairSourceIndex` — ordinal of the permutation group within the project
- Transcoded term strings produced by EncodingSegment from `genSeed.seedPrefix/seedSuffix`

Note: until expression rewriting is in place, users writing `fileNameExpression` must use the
fully-qualified `app.*` paths.
