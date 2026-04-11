// =============================================================================
// Runtime Implementation Types
// =============================================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

export type SelectorPath = string | readonly [string, string]

/** Compiled expression function produced by jse-eval compile(). Synchronous. */
export type CompiledExpr = (ctx: Record<string, unknown>) => unknown

/**
 * Raw feature property value as stored by the builder before buildPipeline()
 * compiles it. The ContextualMethod shape (.method + .selectors) matches the
 * user-facing ContextualMethod interface; compilation renames .method to .fn
 * and wraps it in a PreparedPropertyDef discriminant.
 */
export type BuilderPropertyDef =
   | string
   | readonly [string]
   | {
        method: (...args: any[]) => unknown | Promise<unknown>
        selectors: readonly SelectorPath[]
     }

/**
 * Compiled property artefact stored in a PreparedFeature.
 *
 * - "expr"     — string expression compiled once at buildPipeline() time;
 *                evaluated against full stepCtx on every invocation.
 * - "indirect" — two-stage: outer expression compiled once (evaluated against
 *                stepCtx to yield an inner expression string); inner strings
 *                compiled on first encounter and cached for reuse.
 * - "method"   — ContextualMethod; selectors resolved from stepCtx and passed
 *                as positional arguments on every invocation.
 */
export type PreparedPropertyDef =
   | { kind: "expr"; fn: CompiledExpr }
   | { kind: "indirect"; outer: CompiledExpr; cache: Map<string, CompiledExpr> }
   | {
        kind: "method"
        fn: (...args: any[]) => unknown | Promise<unknown>
        selectors: readonly SelectorPath[]
     }

// ---------------------------------------------------------------------------
// Builder-time stage types  (accumulated by createBuilderImpl)
// ---------------------------------------------------------------------------

/** Step implementation stored by addStep (method renamed to fn at build time). */
export interface RuntimeContextualMethod {
   fn: (...args: any[]) => unknown | Promise<unknown>
   selectors: readonly SelectorPath[]
}

export interface RuntimeVirtual {
   kind: "virtual"
   name: string
}

export interface RuntimeInitialDefaults {
   kind: "initialDefaults"
   defaults: Record<string, unknown>
}

export interface RuntimeFeature {
   kind: "feature"
   name: string
   /** "all" = addPublicFeature, "none" = addPrivateFeature, string[] = addFeature public keys */
   publicKeys: "all" | "none" | string[]
   /** Raw values as provided to the builder; compiled in buildPipeline(). */
   properties: Record<string, BuilderPropertyDef>
}

export interface RuntimeStep {
   kind: "step"
   name: string
   impl: RuntimeContextualMethod
}

export interface RuntimeInjection {
   kind: "injection"
   name: string
   isPublic: boolean
}

export type RuntimeStage =
   | RuntimeVirtual
   | RuntimeInitialDefaults
   | RuntimeFeature
   | RuntimeStep
   | RuntimeInjection

// ---------------------------------------------------------------------------
// buildPipeline()-time types  (produced by one-time pre-processing)
// ---------------------------------------------------------------------------

/** Feature with all expression properties compiled and ready for execution. */
export interface PreparedFeature {
   kind: "feature"
   name: string
   publicKeys: "all" | "none" | string[]
   properties: Record<string, PreparedPropertyDef>
}

/**
 * Execution-order stage: initialDefaults merged into defaults, virtual slots
 * replaced by their fulfilling features (or dropped into the unfulfilled set),
 * and all expression strings compiled to CompiledExpr closures.
 */
export type PreparedStage = PreparedFeature | RuntimeStep | RuntimeInjection

/* eslint-enable @typescript-eslint/no-explicit-any */
