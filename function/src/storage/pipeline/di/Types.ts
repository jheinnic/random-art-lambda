/**
 * DI tokens and shared types for the storage pipeline modules.
 *
 * All tokens for this package are declared here; individual module files
 * import from Types.ts and do not declare their own tokens.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Runtime types
// ---------------------------------------------------------------------------

/** Mutable wrapper that holds the builder as it is accumulated by segments. */
export type BuilderRef = { value: any }

/**
 * A closure that declares pipeline segments and produces the compiled pipeline
 * function.  The factory captures config-derived defaults (from ConfigService)
 * but does NOT capture DI-resolved injection values — those are supplied at
 * call time via the compiled function's `injections` argument.
 *
 * The factory is constructed during Phase-2 bootstrap (the Assembly Function)
 * and provided to PipelineModule as a plain value provider under PIPELINE_FACTORY.
 * PipelineModule calls it once at startup and wraps the result to bind
 * DI-resolved injection values.
 */
export type PipelineFactory = () => (...args: any[]) => Promise<any>

// ---------------------------------------------------------------------------
// DI tokens
// ---------------------------------------------------------------------------

/** The compiled pipeline function ready for injection into worker services. */
export const PIPELINE_FN = Symbol("PipelineFn")

/**
 * The PipelineFactory closure provided by the Assembly Function.
 * PipelineModule calls factory(), then wraps the result with WORKER_FILE_STORE
 * bound to the injections argument before exporting as PIPELINE_FN.
 */
export const PIPELINE_FACTORY = Symbol("PipelineFactory")
