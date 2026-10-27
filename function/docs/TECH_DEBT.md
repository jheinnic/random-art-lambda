# Technical Debt Register

**Created:** 2026-10-26, during the re-entry triage (see [REENTRY_STATUS_2026-10.md](REENTRY_STATUS_2026-10.md))
**Scope:** `function/`

## Scoring

Each item is scored from 1 to 5 on three axes:

| Axis | 1 | 5 |
|---|---|---|
| **Impact**: how much it slows work down | barely | blocks work |
| **Risk**: what happens if it is left alone | cosmetic | silent wrong results or a broken deploy |
| **Effort**: rough size of the fix | under an hour | multiple weeks |

On the effort scale, 2 is about half a day, 3 is one to two days and 4 is about a week.

**Priority = (Impact + Risk) × (6 − Effort).** Higher means do it sooner.

## Summary (highest priority first)

| ID | Item | Category | I | R | E | Priority |
|---|---|---|---|---|---|---|
| TD-2 | Expression-form properties are never pruned | Code | 3 | 4 | 2 | **28** |
| TD-6 | Two open design decisions block the Permutations layer | Architecture | 4 | 3 | 2 | **28** |
| TD-8 | The pipeline's input contract has no compile-time guard | Code | 2 | 3 | 1 | **25** |
| TD-16 | The build depends on an untracked generated file (`genjs6.js`) | Infrastructure | 3 | 3 | 2 | **24** |
| TD-1 | A virtual's fulfillment can read features that don't exist yet | Architecture | 3 | 4 | 3 | **21** |
| TD-3 | Pure functions aren't visible to direct expressions | Code | 2 | 2 | 1 | **20** |
| TD-9 | Leftover review items from the May 4 pipeline work | Code | 2 | 2 | 1 | **20** |
| TD-12 | Stale design notes and doc comments | Documentation | 2 | 2 | 1 | **20** |
| TD-14 | Remaining gaps in the pipeline tests | Test | 2 | 3 | 2 | **20** |
| TD-15 | `ts-jest` 28 doesn't support TypeScript 5.9 | Dependency | 2 | 3 | 2 | **20** |
| TD-5 | The Permutations-layer expander isn't written, so submission is disabled | Architecture | 5 | 3 | 4 | **16** |
| TD-4 | Segments check virtual contracts and name collisions only partially | Code | 2 | 3 | 3 | **15** |
| TD-10 | `FromAppModule`'s demo file-path expression points at the wrong names | Code | 1 | 2 | 1 | **15** |
| TD-11 | The Trigram example specs don't match `TrigramProjectSpec` | Documentation | 2 | 1 | 1 | **15** |
| TD-17 | Untracked scratch files clutter `function/` | Infrastructure | 1 | 1 | 1 | **10** |
| TD-13 | Feature method parameters aren't typed from their selectors | Code | 2 | 1 | 3 | **9** |
| TD-7 | Queue configuration in modules vs the deployment tenancy model | Architecture | — | — | — | needs discovery |

## Items

### TD-1: A virtual's fulfillment can read features that don't exist yet
*Architecture. Pinned by the test "TD-1" in `src/pipeline/__tests__/core.test.ts`.*

`buildPipeline` runs the feature that fulfills a virtual in the virtual's slot, so that consumers
declared right after the virtual see a value. But the fulfilling feature is type-checked against
the context where it is *declared*, which is later. If it reads a feature added between the
virtual and itself, the code type-checks cleanly and then throws a `TypeError` at runtime.

**Why it matters:** a pipeline can pass `tsc` and still fail in the worker. Today it's avoided only
by convention: every current fulfillment reads just constants or initial input.

**Direction:** order features by their dependencies instead of by insertion order plus the slot
move.
- Initials, injections and pure functions are already handled first.
- Steps are leaves and can all run last.
- Among features:
  - Derive each feature's dependencies from its method selectors, and from the root names in its
    expressions, found by parsing with `jsep`.
  - Treat a virtual's name as the feature that fulfills it.
  - Topologically sort, with insertion order as the tiebreak.
  - Report cycles as an error when the pipeline is built.
- Indirect expressions can't be analyzed, because their inner expression is only known at
  runtime. Either treat them as depending on every earlier feature, or give them an explicit
  import list.

A cheaper stopgap is a build-time check that throws a clear error. Either way, document the rule
in `function/CLAUDE.md`: a fulfilling feature may only depend on what exists where the virtual was
declared.

**Note:** layering by kind alone (all features in insertion order, then steps) is not enough.
`EncodingSegment`'s `encodedTerms` is a *feature* that reads the `taskTermEncoding` virtual.

### TD-2: Expression-form properties are never pruned
*Code. Pinned by the test "TD-2".*

The pruning cascade only covers method-form properties, which list their selectors. An expression
such as `"v.x"` that reads an unfulfilled virtual, or a pruned feature, is still evaluated, and
throws a `TypeError`.

**Why it matters:** the promise that a missing virtual quietly prunes whatever depends on it holds
only for method-form features.

**Direction:** reuse the dependency analysis from TD-1, and run the existing `selectable()` check
on features as well as steps. Do this before TD-1, since it is the smaller change.

### TD-3: Pure functions aren't visible to direct expressions
*Code. Pinned by the test "TD-3".*

`addPureFunction` puts functions only in the public expression context. Direct expressions are
evaluated against the full step context, so `"shout('hi')"` fails with
`'shout' is not a function`. The function is reachable only from the inner part of an indirect
expression.

Pure functions do take call-site arguments: `join(input.first, input.second, '-')` works from an
inner expression. The only limitation is *which* expressions can see them. Don't confuse them with
method-form properties (`{ method, selectors }`, or `cm()`), whose arguments are bound by selectors
and which compute a value rather than being callable.

**Direction:** decide whether this is intended. If not, add pure functions to the step context
too.

### TD-4: Segments check virtual contracts and name collisions only partially
*Code.*

- Inside a segment, `ConditionalFeatureProps` checks a feature's contract only against the
  segment's *own* virtuals. Fulfilling a virtual declared by the witness with the wrong shape is
  caught only when the helper is applied, as a vague "argument not assignable" error at the call
  site.
- The May 4 change narrowed the name-collision check in `SegmentContextBuilder`'s
  `add{Public,Private}Feature` from `UnusedKey<KnownAC>` to `UnusedKey<AddedSC>`. That allows
  fulfilling a witness virtual, but it no longer checks for collisions with the witness's
  concrete features.

**Direction:** track the witness's virtuals and concrete features separately, so the check can be
"absent from the known concrete features, or equal to a known virtual".

### TD-5: The Permutations-layer expander isn't written, so submission is disabled
*Architecture. Blocked by TD-6.*

These pieces are missing:
- the `PermutationsExpander` itself, which turns a `PermutationsProjectSpec` into a
  `WorkerProjectSpec` (base64url encoding, assigning task indices, and serializing the domain to
  an `AppDomainMemento`)
- the worker segment that deserializes the memento under `app`
- the FlowProducer's intake of `WorkerProjectSpec`

Until then, `TrigramProjectSubmitter.submitProject` throws a "not implemented" error. The four
`it.todo` tests in `PermutationExpander.test.ts` describe what the expander must do.

### TD-6: Two open design decisions block the Permutations layer
*Architecture. These are decisions, not code.*

1. **Promoted fields or config?** The Apr 25 notes say `inputEncoding` and `filenameExpression`
   travel as first-class spec fields. The Apr 26 code reads them from `ConfigService` when the
   pipeline is built.
2. **Shape of the domain data.** The design notes describe a nested `app.domain`. A May 12 comment
   on `PermutationsProjectSpec` sketches a richer alternative: an `AllCidsGroup`, plus Group,
   Pair, Term and Region extension points flattened into the task domain under the prefixes
   `group_`, `pair_`, `prefix_`/`suffix_` and `region_`, and a `cid_name` field. The interfaces
   still use the simpler `appDomain?`.

**Direction:** decide both, then update `painting/CLAUDE.md`, `painting/permutations/CLAUDE.md`,
`app/trigram-permutation/CLAUDE.md` and the spec doc comments to match.

### TD-7: Queue configuration in modules vs the deployment tenancy model
*Architecture. Not scored; needs discovery.*

You recall a larger gap in how queues are configured inside modules, relative to the deployment
tenancy model. It wasn't investigated in this session and is planned for a separate discussion.
It probably overlaps with TD-5 (FlowProducer intake) and with wiring a bootstrap for the pipeline
(TD-8).

### TD-8: The pipeline's input contract has no compile-time guard
*Code.*

- `TrigramPipelineInput` describes what the compiled pipeline expects, but nothing references it.
  It had already drifted from the real input type once. `OptionalWithProp` fixed that, but nothing
  stops it drifting again.
- Nothing consumes the compiled pipeline yet: `TrigramModuleTypes.PipelineFn` is exported but never
  injected. So no call site exists where the compiler could catch a mismatch.

**Direction:** derive `TrigramPipelineInput` from the pipeline's parameter type, or add a
compile-time check that the two types are equal. Wiring the real bootstrap belongs with TD-5 and
TD-7.

### TD-9: Leftover review items from the May 4 pipeline work
*Code.*

- `PipelineBuilder`'s `AllContext` type parameter now defaults to `{}`. The original
  `Mixin<StepContext, VirtualContext>` is left commented out. Decide whether to restore it.
- `createFixedEncodingBinding` fulfills `taskTermEncoding` with `addPublicFeature`. The inline
  version it replaced used `addPrivateFeature`. Confirm which visibility is intended.
- `_movedNames` in `core.ts` is unused.

### TD-10: `FromAppModule`'s demo file-path expression points at the wrong names
*Code.*

The `stagedFilePath` expression uses top-level `appPrefixString` and `appSuffixString`, but those
live under `encodedTerms`, so it would likely produce `undefined/undefined.png`. The module also
runs its pipeline in a `console.log` at import time.

**Direction:** fix the expression, or move the demo to the attic.

### TD-11: The Trigram example specs don't match `TrigramProjectSpec`
*Documentation.*

All five files in `src/app/trigram-permutation/examples/` differ from the current model in three
ways, so the `expand-project` CLI fails on every one of them. This predates `2491d04`.
- Each has a single `permutation` object, where the model expects a `permutationSpecs` array.
- They use the `expandType` values `permuteAllPairs` and `permutePrefixSuffix`, where the enum has
  `AllPairs` and `PrefixSuffix`.
- They use `sources` instead of `sourceTrigrams`.

### TD-12: Stale design notes and doc comments
*Documentation.*

- `function/CLAUDE.md`:
  - lists `Testy.ts`, which no longer exists
  - shows the old `AllContext` default
  - doesn't describe `extendInitial` namespaces or `OptionalWithProp`
  - lacks the fulfillment-ordering rule from TD-1
- `painting/permutations/CLAUDE.md` says the spec includes `inputEncoding`; it doesn't (TD-6).
- The doc comment on `CheckFeatureProps` describes "keys missing from Props", a case no call site
  can produce.
- The January summaries in `docs/` describe code that has since moved to `attic/`.

### TD-13: Feature method parameters aren't typed from their selectors
*Code.*

With the 2-argument `add*Feature` form, an unannotated method parameter is typed as `any` and
rejected with a misleading "not assignable to string" error. Feature methods therefore have to be
annotated by hand.

`stash@{0}`'s 3-argument form, which takes a `PropertySelectorsMap`, would give them their types.
It became callable once `withContextSubject<T>()` arrived, and a scratch probe confirmed it works.
Its `FeatureProperties` type needs one fix first: replace the `NonNullable<Sel[K]> &
ReadonlyArray<…>` intersection with `Sel[K] extends infer S extends ReadonlyArray<…>`. Keep the
stash.

### TD-14: Remaining gaps in the pipeline tests
*Test.*

The 18 tests in `src/pipeline/__tests__/` pin execution order, namespaces, visibility, virtual
fulfillment, pruning and segment replay. Still uncovered:
- `addFeature` with a split public/private shape
- pruning that involves injections
- what happens when an indirect expression fails to compile
- the type-level rejections in `BeforeSegment`
- the painting segments (`EncodingSegment`, `WorkerPoolSegment`) at runtime

### TD-15: `ts-jest` 28 doesn't support TypeScript 5.9
*Dependency.*

`jest` 28.1.2 and `ts-jest` 28.0.5 run against TypeScript 5.9.2, and every run warns that ts-jest
supports only TypeScript `>=4.3.0 <5.0.0`.

**Direction:** upgrade `jest` and `ts-jest` together, and re-run the suite.

### TD-16: The build depends on an untracked generated file (`genjs6.js`)
*Infrastructure.*

`GenJs6Provider.ts` imports `./genjs6.js`, which is gitignored. A fresh clone fails `tsc` with
TS2307 (verified with `git archive HEAD`). The `copyGenJs` build script copies the file only if
it already exists.

**Direction:** document how to generate it, generate it during the build, or ship a type-only
stub.

### TD-17: Untracked scratch files clutter `function/`
*Infrastructure.*

These leave a lot of noise in `git status`:
- `input.txt`, `targets.txt`, and the `01K*.{dat,sdat,txt}` render-hash listings
- `allPng`, `FlowProducerBlocks.dat` and `pt/`
- two Vim swap files: `.swp`, and `.aspecs.dat.swo`

**Direction:** move them to a scratch folder outside the repo, or add them to `.gitignore`.

## Remediation plan

It's phased so it can run alongside feature work.

**Phase 0: decisions, no code.**
- Decide TD-6, and whether TD-3's behavior is intended.
- Decide the TD-9 questions.
- Start the TD-7 discussion, in its own session.

**Phase 1: quick wins, about a day in total.**
- TD-8 guard
- TD-16 build fix
- TD-11 examples
- TD-12 docs, including the TD-1 ordering rule
- TD-10, TD-9 and TD-17

**Phase 2: harden the pipeline runtime.** TD-2 and then TD-1 share the `jsep`-based dependency
analysis.
- Add the TD-14 tests first, to cover the changes.
- Then TD-3 and TD-4.
- Do TD-15 at the start, so the test runner is on a supported version.
- When TD-1, TD-2 or TD-3 is fixed, update its pinned test in `core.test.ts`.

**Phase 3: feature work that also pays down debt.**
- TD-5 (the Permutations expander), once TD-6 is decided.
- Wiring the bootstrap (the rest of TD-8), together with whatever TD-7 concludes.

**Optional:** TD-13.
