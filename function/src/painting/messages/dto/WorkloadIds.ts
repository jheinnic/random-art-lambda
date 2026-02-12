import { WorkloadId } from "../../../messages/interface/NamedValues.js"

/**
 * Workload identifier for the RandomArt codebase.
 *
 * WorkloadId identifies the codebase/team that owns a family of message formats,
 * NOT individual message types. The Codec registered for this workload handles
 * the superset of data types that may appear across all RandomArt messages.
 *
 * Future: This should be registered via Module Augmentation when the RandomArt
 * plugin is imported, appearing only in client/server builds that include the
 * appropriate RandomArt content.
 */
export const WORKLOAD_RANDOM_ART = "random-art" as WorkloadId

/**
 * @deprecated DESIGN REVIEW PENDING
 *
 * The granular per-message-type WorkloadIds below were created under a
 * misunderstanding of the WorkloadId design intent.
 *
 * WorkloadId was meant to:
 * - Correlate with a codebase/team, not act as a message-type discriminator
 * - Scope Codec lookup from the registry (one Codec handles all message types)
 * - Later serve as a scoping token for ReleaseVersion negotiation
 *
 * The Codec doesn't need to discriminate message types - it handles the superset
 * of data types across all messages. Where messages have extensibility points
 * (like DomainProject/DomainTask), the Codec constrains allowed data types.
 *
 * These granular IDs are preserved for review but should likely be removed.
 * Code using them should migrate to WORKLOAD_RANDOM_ART.
 */

// === DEPRECATED: Project-level messages ===

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_MULTI_PROJECT_REQUEST =
   "random-art.project.multi.request" as WorkloadId

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_MULTI_PROJECT_REPLY =
   "random-art.project.multi.reply" as WorkloadId

// === DEPRECATED: Task-level messages ===

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_SINGLE_TASK_REQUEST =
   "random-art.task.single.request" as WorkloadId

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_GATHER_PARTS_REQUEST =
   "random-art.task.gather.request" as WorkloadId

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_GATHER_PARTS_RESULT =
   "random-art.task.gather.result" as WorkloadId

// === DEPRECATED: Chunk-level messages ===

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_PARTIAL_PAINT_REQUEST =
   "random-art.chunk.paint.request" as WorkloadId

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_PARTIAL_PAINT_RESULT =
   "random-art.chunk.paint.result" as WorkloadId

// === DEPRECATED: Project task gathering ===

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_GATHER_PROJECT_TASKS_REQUEST =
   "random-art.project.gather-tasks.request" as WorkloadId

/** @deprecated Use WORKLOAD_RANDOM_ART instead */
export const WORKLOAD_GATHER_PROJECT_TASKS_RESULT =
   "random-art.project.gather-tasks.result" as WorkloadId

/**
 * @deprecated Use WORKLOAD_RANDOM_ART instead
 */
export const ALL_PAINTING_WORKLOAD_IDS: readonly WorkloadId[] = [
   WORKLOAD_MULTI_PROJECT_REQUEST,
   WORKLOAD_MULTI_PROJECT_REPLY,
   WORKLOAD_SINGLE_TASK_REQUEST,
   WORKLOAD_GATHER_PARTS_REQUEST,
   WORKLOAD_GATHER_PARTS_RESULT,
   WORKLOAD_PARTIAL_PAINT_REQUEST,
   WORKLOAD_PARTIAL_PAINT_RESULT,
   WORKLOAD_GATHER_PROJECT_TASKS_REQUEST,
   WORKLOAD_GATHER_PROJECT_TASKS_RESULT,
] as const
