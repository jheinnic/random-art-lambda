/**
 * V3 Architecture - Declaration Merging Pattern
 *
 * Base context class that extensions augment via TypeScript's native
 * declaration merging. No framework lock-in, natural development flow.
 */

/**
 * Base pipeline context with framework-owned properties
 */
export class PipelineContext {
   jobId = ""
   buffer = Buffer.from("")
}
