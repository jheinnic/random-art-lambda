/* eslint-disable @typescript-eslint/no-empty-interface */
/**
 * Blank base interface for task-level plugin domain contributions.
 *
 * PermutationTaskPaint extends this to slot into the RandomArt worker's
 * expression context under the `app` namespace. Any other middleware layer
 * that speaks directly to RandomArt would also extend this.
 *
 * This interface is intentionally empty. Its sole purpose is to provide a
 * versioned, named extension point that the RandomArt SDK owns. Future SDK
 * versions may add optional fields here without breaking existing extenders.
 */
export interface WorkerTaskDomain {}

/**
 * Blank base interface for project-level plugin domain contributions.
 *
 * Follows the same pattern as WorkerTaskDomain but for the project-level
 * parent job (GatherProjectTasksRequest).
 */
export interface WorkerProjectDomain {}
