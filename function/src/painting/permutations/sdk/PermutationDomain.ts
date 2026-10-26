/**
 * Blank base interface for task-level application domain contributions to the
 * Permutations layer.
 *
 * Application paint models extend this to slot their state into
 * PermutationTaskPaint.domain. For applications that contribute no app-specific
 * domain data (e.g. Trigram, which fixes only inputEncoding and otherwise passes
 * through Permutations semantics), no extension is needed and this slot is absent.
 *
 * Intentionally empty — the Permutations SDK owns this extension point.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PermutationTaskDomain {}

/**
 * Blank base interface for project-level application domain contributions to the
 * Permutations layer.
 *
 * Follows the same pattern as PermutationTaskDomain but for the project-level
 * gather-tasks job.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PermutationProjectDomain {}
