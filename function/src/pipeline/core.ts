import jseEval, { compile } from "jse-eval"
import templatePlugin from "@jsep-plugin/template"

import type {
   ContextKeysAndPairs,
   Mixin,
   UnusedKey,
} from "./types.js"
import type {
   ConditionalFeatureProperties,
   ContextualMethod,
   FeatureProperties,
   PipelineBuilder,
   PropertySelectorsMap,
} from "./builder.js"
import type {
   SelectorPath,
   CompiledExpr,
   BuilderPropertyDef,
   PreparedPropertyDef,
   RuntimeStage,
   RuntimeFeature,
   PreparedFeature,
   PreparedStage,
} from "./runtime.js"

// Register template-literal syntax support once for this module.
jseEval.registerPlugin(templatePlugin)

// =============================================================================
// Builder Implementation
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

function createBuilderImpl<
   InitialContext extends object,
   InjectedContext extends object,
   ExprContext extends object,
   StepContext extends object,
   VirtualContext extends object,
   AllContext extends object = Mixin<StepContext, VirtualContext>,
>(
   stages: RuntimeStage[],
): PipelineBuilder<
   InitialContext,
   InjectedContext,
   ExprContext,
   StepContext,
   VirtualContext,
   AllContext
> {
   function next(
      stage: RuntimeStage,
   ): PipelineBuilder<any, any, any, any, any, any> {
      return createBuilderImpl([...stages, stage])
   }

   return {
      extendInitial(defaults: object) {
         return next({
            kind: "initialDefaults",
            defaults: defaults as Record<string, unknown>,
         }) as any
      },

      addVirtualFeature<_VirtualType extends object, NameOut extends string>(
         nameOut: UnusedKey<AllContext, NameOut>,
      ) {
         return next({ kind: "virtual", name: nameOut as string }) as any
      },

      addStep<
         StepOut extends object,
         NameOut extends string,
         NamesIn extends ReadonlyArray<ContextKeysAndPairs<AllContext>>,
      >(
         nameOut: UnusedKey<AllContext, NameOut>,
         implementation: ContextualMethod<AllContext, StepOut, NamesIn>,
      ) {
         return next({
            kind: "step",
            name: nameOut as string,
            impl: {
               fn: implementation.method as any,
               selectors: implementation.selectors as unknown as SelectorPath[],
            },
         }) as any
      },

      addPublicFeature<
         ExprOut extends object,
         NameOut extends string,
         Sel extends PropertySelectorsMap<AllContext, ExprOut> = Record<
            never,
            never
         >,
      >(
         nameOut: UnusedKey<StepContext, NameOut>,
         properties: ConditionalFeatureProperties<
            AllContext,
            VirtualContext,
            NameOut,
            ExprOut,
            Sel
         >,
      ) {
         return next({
            kind: "feature",
            name: nameOut as string,
            publicKeys: "all",
            properties: properties as Record<string, any>,
         }) as any
      },

      addPrivateFeature<
         ExprOut extends object,
         NameOut extends string,
         Sel extends PropertySelectorsMap<AllContext, ExprOut> = Record<
            never,
            never
         >,
      >(
         nameOut: UnusedKey<StepContext, NameOut>,
         properties: ConditionalFeatureProperties<
            AllContext,
            VirtualContext,
            NameOut,
            ExprOut,
            Sel
         >,
      ) {
         return next({
            kind: "feature",
            name: nameOut as string,
            publicKeys: "none",
            properties: properties as Record<string, any>,
         }) as any
      },

      addFeature<
         ExprOut extends object,
         NameOut extends string,
         StepOut extends ExprOut = ExprOut,
         PublicSel extends PropertySelectorsMap<AllContext, ExprOut> = Record<
            never,
            never
         >,
         PrivateSel extends PropertySelectorsMap<
            AllContext,
            Omit<StepOut, keyof ExprOut>
         > = Record<never, never>,
      >(
         nameOut: UnusedKey<StepContext, NameOut>,
         publicProperties: ConditionalFeatureProperties<
            AllContext,
            VirtualContext,
            NameOut,
            ExprOut,
            PublicSel
         >,
         privateProperties: FeatureProperties<
            AllContext,
            Omit<StepOut, keyof ExprOut>,
            PrivateSel
         >,
      ) {
         const publicKeys = Object.keys(publicProperties as object)
         return next({
            kind: "feature",
            name: nameOut as string,
            publicKeys,
            properties: {
               ...(publicProperties as Record<string, any>),
               ...(privateProperties as Record<string, any>),
            },
         }) as any
      },

      addPublicInjection<_InjectedType, NameOut extends string>(
         nameOut: UnusedKey<AllContext, NameOut>,
      ) {
         return next({
            kind: "injection",
            name: nameOut as string,
            isPublic: true,
         }) as any
      },

      addPrivateInjection<_InjectedType, NameOut extends string>(
         nameOut: UnusedKey<AllContext, NameOut>,
      ) {
         return next({
            kind: "injection",
            name: nameOut as string,
            isPublic: false,
         }) as any
      },

      buildPipeline<ResultOut extends object>(
         resultSelectors:
            | {
                 [K in keyof ResultOut]: ContextKeysAndPairs<
                    Mixin<ExprContext, VirtualContext>
                 >
              }
            | ((context: ExprContext) => ResultOut),
      ): (
         initial: InitialContext,
         injections: InjectedContext,
      ) => Promise<Partial<ResultOut>> {
         // ── one-time pre-processing (runs once when buildPipeline() is called) ──

         // Merge all initialDefaults stages into a single baseline object.
         const defaults: Record<string, unknown> = {}
         for (const stage of stages) {
            if (stage.kind === "initialDefaults")
               Object.assign(defaults, stage.defaults)
         }

         // Identify every declared virtual and find its fulfilling feature, if any.
         const virtualNames = new Set<string>()
         for (const stage of stages) {
            if (stage.kind === "virtual") virtualNames.add(stage.name)
         }
         const fulfillments = new Map<string, RuntimeFeature>()
         for (const stage of stages) {
            if (stage.kind === "feature" && virtualNames.has(stage.name))
               fulfillments.set(stage.name, stage)
         }
         // Virtuals with no fulfilling feature will prune any step that depends on them.
         const unfulfilled = new Set<string>(
            [...virtualNames].filter((n) => !fulfillments.has(n)),
         )

         // Compile a raw builder property value into a PreparedPropertyDef.
         // `context` is a human-readable label used in error messages only.
         const compileProperty = (
            raw: BuilderPropertyDef,
            context: string,
         ): PreparedPropertyDef => {
            const tryCompile = (expr: string): CompiledExpr => {
               try {
                  return compile(expr)
               } catch (err) {
                  throw new Error(
                     `Expression parse error in ${context}: ${String(err)}\n  Expression: ${expr}`,
                     { cause: err },
                  )
               }
            }
            if (typeof raw === "string") {
               return { kind: "expr", fn: tryCompile(raw) }
            } else if (raw instanceof Array) {
               return {
                  kind: "indirect",
                  outer: tryCompile(raw[0]),
                  cache: new Map(),
               }
            } else {
               // ContextualMethod: rename .method → .fn for the prepared form.
               return {
                  kind: "method",
                  fn: raw.method,
                  selectors: raw.selectors,
               }
            }
         }

         const compileFeature = (f: RuntimeFeature): PreparedFeature => ({
            kind: "feature",
            name: f.name,
            publicKeys: f.publicKeys,
            properties: Object.fromEntries(
               Object.entries(f.properties).map(([k, v]) => [
                  k,
                  compileProperty(v, `feature "${f.name}", property "${k}"`),
               ]),
            ),
         })

         // Build the execution order:
         //   - Each virtual slot is replaced by its fulfilling feature (if any).
         //   - Fulfilling features are skipped at their original builder position.
         //   - initialDefaults stages are dropped (already merged into defaults).
         //   - Steps and injections pass through unchanged.
         const movedNames = new Set<string>(fulfillments.keys())
         const executionOrder: PreparedStage[] = []
         for (const stage of stages) {
            if (stage.kind === "virtual") {
               const f = fulfillments.get(stage.name)
               if (f !== undefined) executionOrder.push(compileFeature(f))
               // Unfulfilled virtual: omitted from order, tracked in unfulfilled set.
            } else if (stage.kind === "initialDefaults") {
               // Already merged; skip.
            } else if (stage.kind === "feature" && movedNames.has(stage.name)) {
               // Already placed at the virtual's position; skip.
            } else if (stage.kind === "feature") {
               executionOrder.push(compileFeature(stage))
            } else {
               // RuntimeStep | RuntimeInjection — pass through unchanged.
               executionOrder.push(stage)
            }
         }

         const compiledResultSelectors = resultSelectors as
            | Record<string, SelectorPath>
            | ((ctx: Record<string, unknown>) => Record<string, unknown>)

         // ── per-invocation callable ────────────────────────────────────────────
         return async (initial, injections) => {
            // Full context: every concrete value available to steps and methods.
            const stepCtx: Record<string, unknown> = {
               ...defaults,
               ...(initial as Record<string, unknown>),
            }
            // Expression-visible subset: only public outputs reach this context.
            const exprCtx: Record<string, unknown> = {
               ...defaults,
               ...(initial as Record<string, unknown>),
            }
            // Names of stages whose output is unavailable this invocation.
            const pruned = new Set<string>()

            // Resolve a single selector path; returns the value or signals absence.
            const resolvePath = (
               sel: SelectorPath,
               ctx: Record<string, unknown>,
            ): { found: true; value: unknown } | { found: false } => {
               const topKey = typeof sel === "string" ? sel : sel[0]
               if (!(topKey in ctx)) return { found: false }
               if (typeof sel === "string")
                  return { found: true, value: ctx[topKey] }
               const sub = ctx[topKey] as Record<string, unknown>
               if (!(sel[1] in sub)) return { found: false }
               return { found: true, value: sub[sel[1]] }
            }

            // Resolve every selector in the list; returns null if any is absent.
            const resolveArgs = (
               selectors: readonly SelectorPath[],
               ctx: Record<string, unknown>,
            ): unknown[] | null => {
               const args: unknown[] = []
               for (const sel of selectors) {
                  const r = resolvePath(sel, ctx)
                  if (!r.found) return null
                  args.push(r.value)
               }
               return args
            }

            // False if any selector's top-level key is unfulfilled or pruned.
            const selectable = (selectors: readonly SelectorPath[]): boolean =>
               selectors.every((sel) => {
                  const top = typeof sel === "string" ? sel : sel[0]
                  return !pruned.has(top) && !unfulfilled.has(top)
               })

            for (const stage of executionOrder) {
               switch (stage.kind) {
                  case "injection": {
                     // Both public and private injections are supplied at call time
                     // via the injections argument.  The public/private distinction
                     // only controls expression visibility (exprCtx).
                     const value = (injections as Record<string, unknown>)[
                        stage.name
                     ]
                     stepCtx[stage.name] = value
                     if (stage.isPublic) exprCtx[stage.name] = value
                     break
                  }

                  case "step": {
                     if (!selectable(stage.impl.selectors)) {
                        pruned.add(stage.name)
                        break
                     }
                     const args = resolveArgs(stage.impl.selectors, stepCtx)
                     if (args === null) {
                        pruned.add(stage.name)
                        break
                     }
                     const result = await Promise.resolve(
                        stage.impl.fn(...args),
                     )
                     // Steps are always public.
                     stepCtx[stage.name] = result
                     exprCtx[stage.name] = result
                     break
                  }

                  case "feature": {
                     const ns: Record<string, unknown> = {}
                     let failed = false
                     for (const [key, propDef] of Object.entries(
                        stage.properties,
                     )) {
                        switch (propDef.kind) {
                           case "expr":
                              ns[key] = propDef.fn(stepCtx)
                              break
                           case "indirect": {
                              // Outer expression yields an inner expression string.
                              const innerExpr = propDef.outer(stepCtx) as string
                              let innerFn = propDef.cache.get(innerExpr)
                              if (innerFn === undefined) {
                                 const compiled = compile(innerExpr) as
                                    | CompiledExpr
                                    | undefined
                                 if (compiled === undefined) {
                                    failed = true
                                    break
                                 }
                                 propDef.cache.set(innerExpr, compiled)
                                 innerFn = compiled
                              }
                              // Inner expression runs against exprCtx (public subset).
                              ns[key] = innerFn(exprCtx)
                              break
                           }
                           case "method": {
                              const args = resolveArgs(
                                 propDef.selectors,
                                 stepCtx,
                              )
                              if (args === null) {
                                 failed = true
                              } else {
                                 ns[key] = await Promise.resolve(
                                    propDef.fn(...args),
                                 )
                              }
                              break
                           }
                        }
                        if (failed) break
                     }
                     if (failed) {
                        pruned.add(stage.name)
                        break
                     }
                     stepCtx[stage.name] = ns
                     if (stage.publicKeys === "all") {
                        exprCtx[stage.name] = ns
                     } else if (stage.publicKeys !== "none") {
                        // addFeature: only declared public keys enter exprCtx.
                        const publicNs: Record<string, unknown> = {}
                        for (const k of stage.publicKeys) {
                           if (k in ns) publicNs[k] = ns[k]
                        }
                        exprCtx[stage.name] = publicNs
                     }
                     break
                  }
               }
            }

            // Collect results; omit keys whose top-level selector is unavailable.
            if (typeof compiledResultSelectors === "function") {
               return compiledResultSelectors(exprCtx) as any
            }
            const output: Record<string, unknown> = {}
            for (const [resultKey, selector] of Object.entries(
               compiledResultSelectors,
            )) {
               const topKey =
                  typeof selector === "string" ? selector : selector[0]
               if (unfulfilled.has(topKey) || pruned.has(topKey)) continue
               const r = resolvePath(selector, stepCtx)
               if (r.found) output[resultKey] = r.value
            }
            return output as any
         }
      },
   }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Create a new pipeline builder seeded with a known initial context type.
 *
 * @example
 * ```typescript
 * const pipeline = createPipeline<MyInitialState>()
 *   .addPublicFeature("derived", { ... })
 *   .addStep("result", { method: ..., selectors: [...] })
 *   .buildPipeline({ output: ["result", "value"] })
 *
 * const output = await pipeline(initialState, injections)
 * ```
 */
export function createPipeline<
   InitialContext extends object,
>(): PipelineBuilder<
   InitialContext,
   object,
   InitialContext,
   InitialContext,
   object,
   InitialContext
> {
   return createBuilderImpl([])
}
