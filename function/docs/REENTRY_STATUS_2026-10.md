# Re-entry Status — October 2026

**Assessed:** 2026-10-26
**Branch:** `jheinnic/features/bootstrap` @ `2491d04` (2026-04-29)
**Last activity in the working tree:** 2026-05-12

## Update: stabilized and committed (2026-10-26)

Everything after this section describes the state **as found**, before these commits.

| Commit | Contents |
|--------|----------|
| `c108831` | `yarn.lock` refresh from Apr 29 (no `package.json` change) |
| `cfb321d` | Thread B: namespaced `extendInitial`, plus `createFixedEncodingBinding` with the `RequiresVirtual` fix below, plus `ExpressionBasedFeature` |
| `911a77e` | Thread A: the layered models; Trigram now expands to `PermutationsProjectSpec`, and its callers and tests are updated |
| `32f482f` | `InferTwo.ts` moved to `attic/` |
| (next) | The four `CLAUDE.md` design notes and this document |

Each code commit type-checks on its own with `tsc --noEmit` (0 errors). The test suite passes:
12 tests, plus 4 `todo` entries.

Behavior changes:
- `TrigramProjectSubmitter.submitProject` now rejects with an explanatory error until the
  Permutations-layer `PermutationsExpander` exists. `validateProject` still works.
- The `expand-project` CLI prints one line per term pair × region map from the
  `PermutationsProjectSpec`.
- The tests for genSeed encoding, task indices, `plotDataRef` and project counts are now
  `it.todo` entries. They will be written along with the Permutations expander.

Found while stabilizing (these predate this work and are not fixed):
- The JSON files in `src/app/trigram-permutation/examples/` don't match `TrigramProjectSpec`, so
  the CLI fails on them, as it already did at `2491d04`. Each one:
  - has a single `permutation` object instead of a `permutationSpecs` array
  - uses the `expandType` values `permuteAllPairs`/`permutePrefixSuffix` instead of
    `AllPairs`/`PrefixSuffix`
  - uses `sources` instead of `sourceTrigrams`

Still open: the two design-drift questions under Thread A, the Thread B review items, and the
Permutations expander itself. `stash@{0}` is untouched.

## Summary

- The committed state builds. `tsc --noEmit` on `HEAD` reports one error, which predates this work:
  `GenJs6Provider.ts` imports the generated `./genjs6.js`.
- Two threads of work are uncommitted and unfinished:
  - **Thread A — layered spec/sdk/paint refactor** (Apr 25–26, plus a design comment on May 12).
    New layer packages exist. Trigram's models and expander are rewritten. Their callers are not
    updated yet, and the Permutations-layer expander is not written yet.
  - **Thread B — namespaced initial context and a fixed-encoding binding** (May 4).
    `extendInitial` now takes a namespace. A new generic helper fulfills the `taskTermEncoding`
    virtual. That helper's constraint doesn't type-check yet. A tested fix is below.
- The working tree has 48 type errors. All of them come from these two threads or from one
  scratch file.
- `stash@{0}` is an earlier attempt at the problem that `withContextSubject<T>()` later solved.
  It is kept, and nothing in it needs to be applied (see below).
- **Nothing is backed up remotely.** The local branch is 7 commits ahead of `origin`. All of
  Thread A, including the four `CLAUDE.md` design notes, is untracked.

## Timeline (reconstructed from commits and file modification times)

| Date | What happened |
|------|---------------|
| Jan 2026 | Middleware chain and `SingleContentDependence` configuration design (now in `attic/`) |
| Feb 11–15 | Render runs written to `a/bb/<ULID>/` |
| Apr 11 | Middleware exploration moved to the attic (`327c251`). New pipeline work begins |
| Apr 21 | Pipeline framework (`b0b8d30`) and Trigram pipeline demo (`73df61c`) |
| Apr 25 12:28 | `stash@{0}` created (3-argument feature form) |
| Apr 25 12:41 | `function/CLAUDE.md` written, describing the `withContextSubject<T>()` design |
| Apr 25 21:00 | Layer `CLAUDE.md` notes and the new `painting/{sdk,spec,permutations}` packages |
| Apr 26 | Trigram specs slimmed, paint models deleted, expander rewritten; render-hash listings made |
| Apr 29 | `2491d04` "Pipeline compilation with generic currying" (`withContextSubject`), the last commit |
| May 3 | `FlowProducerBlocks.dat` stub |
| May 4 | Thread B: namespaced `extendInitial`, `SetFixedEncodingSegment.ts` |
| May 12 | Expanded design comment on `PermutationsProjectSpec`, the last edit |

## Thread A — Layered spec/sdk/paint refactor

The design is in [painting/CLAUDE.md](../src/painting/CLAUDE.md),
[painting/permutations/CLAUDE.md](../src/painting/permutations/CLAUDE.md) and
[trigram-permutation/CLAUDE.md](../src/app/trigram-permutation/CLAUDE.md). Expansion runs
Trigram → Permutations → RandomArt. Each layer receives a `spec`, publishes a blank `sdk` base
interface, and produces a `paint` model. Plugin domain data crosses into RandomArt as an opaque
`AppDomainMemento` string.

### Done (uncommitted)

- **RandomArt SDK:** [WorkerDomain.ts](../src/painting/sdk/WorkerDomain.ts) defines the
  `WorkerTaskDomain` and `WorkerProjectDomain` base interfaces.
  [AppDomainMemento.ts](../src/painting/sdk/AppDomainMemento.ts) defines the nominal string type.
- **RandomArt spec:** [WorkerProjectSpec.ts](../src/painting/spec/WorkerProjectSpec.ts) holds
  `projectDomain`, `regionMapNames` and `taskUnits: PaintingTask<AppDomainMemento, …>`.
- **Permutations layer:**
  [PermutationDomain.ts](../src/painting/permutations/sdk/PermutationDomain.ts),
  [PermutationTaskPaint.ts](../src/painting/permutations/paint/PermutationTaskPaint.ts) (the
  indices plus an optional `domain`), and
  [PermutationsProjectSpec.ts](../src/painting/permutations/spec/PermutationsProjectSpec.ts)
  (term groups made of term pairs).
- **Trigram:**
  - `models/paint/*` and `spec/PermutationInputSpec.ts` are deleted.
  - The spec models are now `readonly` and have no `inputEncoding` or `fileNameExpression`.
  - [PermutationExpander.ts](../src/app/trigram-permutation/logic/PermutationExpander.ts) now
    produces a `PermutationsProjectSpec`.

### Broken: callers not yet updated (32 errors)

These still import `models/paint/*` or the old expander exports (`expandToMultiTaskRequest`,
`pairPrefixSuffixSource`, `pairAllPairsSource`, `expandTermPairs`):

- `app/trigram-permutation/logic/__tests__/PermutationExpander.test.ts` (21). The test also
  passes `fileNameExpression` on specs.
- `app/trigram-permutation/cli/expand-project.ts` (4)
- `app/trigram-permutation/components/TrigramProjectSubmitter.ts` (4)
- `app/trigram-permutation/index.ts` (3)

### Not written yet

- The **Permutations-layer `PermutationsExpander`**, which turns a `PermutationsProjectSpec` into
  a `WorkerProjectSpec`. It handles base64url encoding, index assignment, and
  `JSON.stringify` → `AppDomainMemento`.
- The **worker pipeline segment** that `JSON.parse`s the memento and places it under `app`.
- The **FlowProducer** accepting a `WorkerProjectSpec`.
- A rename: Trigram's class is still called `PermutationExpander`. The design notes call it
  `TrigramExpander`. Renaming it avoids confusion with the Permutations-layer
  `PermutationsExpander`.

### Design drift to settle before continuing

1. **Promoted fields.** The Apr 25 notes say `inputEncoding` and `filenameExpression` travel as
   first-class fields in each layer's spec. The newer Apr 26 code takes a different position. The
   doc comments on `WorkerProjectSpec` and `PermutationsProjectSpec` say these are *not* spec
   fields: for the first pass they are hardcoded from `ConfigService` when the pipeline is built.
   `PermutationsProjectSpec` has no `inputEncoding`, although `permutations/CLAUDE.md` says it
   does.
2. **Shape of the domain data.** The notes describe a single nested `app.domain` slot. The May 12
   comment on `PermutationsProjectSpec` sketches a richer scheme:
   - a third group type, `AllCidsGroup`
   - extension points for Group, Pair, Term and Region, flattened into the task domain under the
     key prefixes `group_`, `pair_`, `prefix_`/`suffix_` and `region_`, plus a `cid_name` field
   - a project domain that passes through unchanged

   So far this exists only as a comment, and one sentence in it is unfinished ("…are not modeled
   here,  carried here."). The interfaces still have the simpler `appDomain?`.

## Thread B — Namespaced initial context and fixed-encoding binding (May 4)

### What changed

- **Namespaced initial context:** `extendInitial(name, defaults)` places caller input under a
  named key instead of spreading it flat. `ArtworkEngineSegment` uses `"task"` and
  `TrigramPipelineModule` uses `"trigram"`.
  - At runtime, `core.ts` shallow-merges defaults within each namespace, and caller-supplied
    values win.
  - Selectors become `["task", "seedPrefix"]`, and expressions become
    `trigram.resolvedFileNameExpression`.
  - `TrigramPipelineInput` is now `{ task: PaintedTask; trigram?: {…} }`.
  - The `CompatibleForMixin` check on `extendInitial` is replaced by `UnusedKey` on the
    namespace name.
- **Typo fix:** `withSpitContextSubject` → `withSplitContextSubject`.
- **New type helpers:** `WithPublicFeature` and `WithPrivateFeature` in `builder.ts` describe
  "builder `B` plus feature X", so standalone generic functions can state their return types.
- **New helper:**
  [SetFixedEncodingSegment.ts](../src/painting/pipeline/components/SetFixedEncodingSegment.ts)
  adds `createFixedEncodingBinding(encoding, builder)`, which fulfills the `taskTermEncoding`
  virtual declared by `EncodingSegment` with a value supplied at runtime. It replaces an inline
  `addPrivateFeature` in `FromAppModule`. It uses `addPublicFeature`, so the feature changed from
  private to public. Check whether that was intended.

### Broken (4 errors in `FromAppModule.ts`)

The constraint `B extends PipelineBuilder<any, any, {}, {}, Virt, any, AllContext>` rejects real
builders (TS2345). The errors on lines 40–42 follow from that first one.

### Candidate fix (tested in a scratch copy, not applied)

```ts
// Collapses to never unless B has declared a virtual `Name` whose contract is exactly T.
type RequiresVirtual<B, Name extends string, T> =
   B extends PipelineBuilder<any, any, any, any, infer V, any, any>
      ? Name extends keyof V
         ? [V[Name]] extends [T]
            ? [T] extends [V[Name]]
               ? B
               : never
            : never
         : never
      : never

export function createFixedEncodingBinding<
   B extends PipelineBuilder<any, any, any, any, any, any, any>,
>(
   encoding: BufferEncoding,
   builder: B & RequiresVirtual<B, "taskTermEncoding", TaskTermEncoding>,
): WithPublicFeature<B, "taskTermEncoding", TaskTermEncoding>
// body unchanged
```

This uses the same idiom as `BeforeSegment`: `B & Check<B>` collapses to `never` when the
precondition fails. Results:

- `FromAppModule.ts` compiles.
- A builder that never declared `taskTermEncoding` is rejected with TS2345.
- Simply loosening the constraint to all-`any` also compiles, but it **accepts builders that are
  missing the virtual**. That was verified, so avoid it.

### Review items (not tested)

- `PipelineBuilder`'s `AllContext` default changed from `Mixin<StepContext, VirtualContext>` to
  `{}`, with the original commented out. It looks like an experiment aimed at the same constraint
  problem. Check whether it can be reverted once the fix above is in.
- In `segment.ts`, `SegmentContextBuilder.add{Public,Private}Feature` narrowed the name-collision
  check from `UnusedKey<KnownAC>` to `UnusedKey<AddedSC>`. That lets a segment fulfill a virtual
  declared by its witness, but it also stops checking for collisions with the witness's other
  features.

## `stash@{0}` — 3-argument feature form (kept, do not apply)

**When:** 2026-04-25 12:28, on top of `a3a0700`. That is 13 minutes before `function/CLAUDE.md`
described `withContextSubject<T>()`, and 4 days before that design was committed in `2491d04`.

**The problem it targeted:** callers passed explicit type arguments, as in
`addPublicFeature<EncodedTerms, "encodedTerms">(name, props)`. TypeScript has no partial
type-argument inference, so once some type arguments are given, the rest fall back to their
defaults. `Props` became `LooseFeatureProp`, and method parameters went unchecked.

**What it was for:** declaring each named property as a function plus the context arguments to
call it with, with the arguments listed in a separate map keyed by property name. The map idea
predates the stash:
- `SELECT_TOKENS_MAP` in `EncodingSegment` was introduced in `73df61c` (Apr 21) as the third
  type argument of `addPublicFeature`.
- `6726f8e` (Apr 22) replaced it with `typeof termProperties`, which left the map unused.
- The stash turned the map into a runtime argument typed by `PropertySelectorsMap`, and deleted
  the unused map.

Method-form properties (`{ method, selectors }`) already existed, and the stash's
`mergeSelectorsIntoProps` rebuilds exactly that shape, so the runtime behavior is unchanged. The
change was to how properties are declared and type-checked. The function is passed as a value,
for example an imported function. It is not looked up from the pipeline context by name.

**What it tried:**

1. A 3-argument overload, `addPublicFeature(name, selectorsMap, { key: { method } })`, meant to
   infer `Sel` from the second argument. At runtime, `mergeSelectorsIntoProps` would recombine
   the two objects.
2. Splitting `ConditionalFeatureProps` into two intersected checks, `CheckMethodParams` and
   `VirtualCheck`.
3. An `ExpressionBasedFeature = string | readonly [string]` alias, with a doc comment on the
   direct form (a plain string) and the indirect form (a 1-tuple whose expression evaluates to
   another expression).
4. In `EncodingSegment`: dropping the explicit `typeof termProperties` type argument, adding a
   deliberately wrong `foo: string` method parameter (a probe to see whether the checker catches
   it), and removing `SELECT_TOKENS_MAP`.

**Why it was a dead end:** the 3-argument overload has three type parameters. With only two
supplied, TypeScript picks the 2-argument overload and reports
`TS2554: Expected 2 arguments, but got 3`. This was reproduced in an isolated test with TS
5.9.2. `withContextSubject<T>()` solved the problem instead, by fixing the subject type in its own
call so that every remaining type parameter is inferred.

**How it relates to the current code:**

- None of the stash's new identifiers exist today (`CheckMethodParams`, `VirtualCheck`,
  `PropertySelectorsMap`, `FeatureProperties`, `mergeSelectorsIntoProps`,
  `ExpressionBasedFeature`).
- It would not apply cleanly: `2491d04` rewrote most of `builder.ts` and `segment.ts`.
- Carried over (2026-10-26):
  - `ExpressionBasedFeature`, with its original doc comment, is back in `types.ts`. It replaces
    the hand-written `string | readonly [string]` in `LooseFeatureProp`, `CheckProp`,
    `CheckFeatureProps`, `AnyProps` (`segment.ts`) and `BuilderPropertyDef` (`runtime.ts`). The
    type-check error list is unchanged. The `CheckFeatureProps` else-branch can't be reached
    from any call site, because every `Props` constraint requires all keys. Indirect expressions
    were already accepted on every property through `CheckProp`, so this is a naming change,
    not new support.
- Still worth considering:
  - **The 3-argument form with `PropertySelectorsMap`.** It is callable now that
    `withContextSubject<T>()` removed the explicit type arguments. A scratch probe showed it
    gives unannotated method parameters their types from the selectors. Today's 2-argument form
    types them as `any` and rejects them with a misleading "not assignable to string" error, so
    feature methods must be annotated by hand. The stash's `FeatureProperties` needs one fix
    first, because its `NonNullable<Sel[K]> & ReadonlyArray<…>` intersection rejects correct
    methods. Use `Sel[K] extends infer S extends ReadonlyArray<ContextKeysAndPairs<Context>>`
    instead. Adopting the form means:
    - overloads on both context builders' `add{Public,Private}Feature`
    - a runtime selector merge (the stash's `mergeSelectorsIntoProps`), applied in `core.ts` and
      when `segment.ts` records operations
    - a virtual-fulfillment check like the stash's `VirtualCheck`
  - the `CheckMethodParams`/`VirtualCheck` split, if `ConditionalFeatureProps` proves hard to
    read
  - removing `SELECT_TOKENS_MAP`, which is still only referenced in its own file

To protect it from `git stash drop`/`clear` and from stash indices shifting, give it a branch
name without removing the stash: `git branch archive/stash-3arg-feature-form 'stash@{0}'`.

The other stashes (`stash@{1}`–`stash@{7}`) are on other branches or older and were not examined.

## Type-check results

| | `HEAD` | Working tree |
|---|---|---|
| Total errors | 1 | 48 |
| `GenJs6Provider.ts` (generated `genjs6.js` missing) | 1 | — |
| Trigram callers (Thread A): test 21, CLI 4, submitter 4, `index.ts` 3 | — | 32 |
| `FromAppModule.ts` (Thread B) | — | 4 |
| `src/InferTwo.ts` (scratch file) | — | 12 |

`GenJs6Provider.ts` doesn't error in the working tree because a `genjs6.js` is present locally
(the `copyGenJs` build script copies it if it exists).

`function/CLAUDE.md` lists `src/painting/pipeline/components/Testy.ts` as an observation file,
but that file no longer exists. Its `AllContext` row still shows the old
`Mixin<StepContext, VirtualContext>` default (see the Thread B review items).

## Untracked files

| Path | What it is |
|------|------------|
| `CLAUDE.md`, `src/painting/CLAUDE.md`, `src/painting/permutations/CLAUDE.md`, `src/app/trigram-permutation/CLAUDE.md` | Design notes from Apr 25. Commit these |
| `src/painting/{sdk,spec,permutations}/` | Thread A code |
| `src/painting/pipeline/components/SetFixedEncodingSegment.ts` | Thread B code |
| `src/InferTwo.ts` | Apr 25 scratch experiments with `NoInfer` and `Record<keyof T, Name>` (12 errors). Move it to the attic or exclude it from the build |
| `input.txt`, `targets.txt`, `01K*.{dat,sdat,txt}` | Apr 26: SHA-1 and path listings of PNGs from the Feb render runs in `a/bb/<ULID>/`. The same hash appears in several run folders, so this looks like a duplicate or determinism check. The `.dat`/`.sdat` files were not decoded |
| `FlowProducerBlocks.dat` | May 3: a three-line stub for a `MultiTaskCompletionStage` (inputs from the flow: `ProjectId`, `TaskCount`) |
| `pt/` | Aug 2025: a Python toy script and pickled SVM models for color-diversity scoring. Unrelated to either thread |
| `.swp` | A stale Vim swap file, unrelated to this project |

## Suggested re-entry order

0. **Back up first** (your decision): commit the untracked design notes and the work in progress
   to a WIP branch, push the 7 local commits, and optionally give the stash a branch name.
1. **Settle the two design-drift questions** above, and update the `CLAUDE.md` notes to match.
2. **Finish Thread B**, which is small and self-contained:
   - apply the `RequiresVirtual` fix
   - decide on the `AllContext` default and the `UnusedKey<AddedSC>` change
   - confirm whether `taskTermEncoding` should be public or private

   This gets `FromAppModule` compiling.
3. **Update Thread A's callers**: move the CLI, submitter, `index.ts` and the tests onto
   `PermutationsProjectSpec`, and rename Trigram's `PermutationExpander` to `TrigramExpander`.
4. **Write Thread A's new code**: the Permutations-layer `PermutationsExpander`, the segment that
   deserializes the memento, and the FlowProducer's intake of `WorkerProjectSpec`.
5. Move `InferTwo.ts` to the attic, or exclude it from the build.

## Where the design knowledge lives

- **Current:** the four `CLAUDE.md` files listed above. Claude's memory files
  `project_layered_domain_architecture` (Apr 25) and `project_messaging_architecture` (Apr 16).
- **Historical** (superseded by the Apr 11 move to the attic): Claude's memory files for the
  middleware chain, configuration system, refactoring plan, Hypo files and storage layer, and the
  January `docs/*.md` summaries. They describe code that now lives in `attic/`.
- **Lost:** Claude Code session transcripts from before 2026-10-26 were deleted by the default
  30-day cleanup. Retention is now set to 3650 days in `~/.claude/settings.json`.
