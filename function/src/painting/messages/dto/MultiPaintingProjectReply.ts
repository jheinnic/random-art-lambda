import type { ULIDString } from "../../../messages/interface/index.js"
import { PaintProjectId } from "../values/PaintProjectId.js"
import type { PaintTaskId } from "../values/PaintTaskId.js"

/**
 * Reply returned after RandomArt accepts a MultiTaskProjectRequest.
 *
 * This reply is sent after the orchestrator has:
 * 1. Validated the request
 * 2. Assigned ULIDs to the project and each task
 * 3. Cached task data in PendingTasksCache
 * 4. Enqueued jobs to BullMQ
 *
 * The reply provides the caller with the assigned identifiers needed to:
 * - Track project status
 * - Correlate completed task results with original request items
 * - Make future API calls referencing specific tasks
 *
 * **Index Parity**: The `taskIds` array maintains index parity with the
 * input `taskUnits` array. That is, `taskIds[i]` is the ULID assigned to
 * the task defined by `request.taskUnits[i]`.
 */
export interface MultiPaintingProjectReply {
   /**
    * ULID assigned to this project by RandomArt.
    *
    * Use this identifier for:
    * - Querying project status
    * - Cancelling the project
    * - Retrieving aggregated results
    */
   projectId: PaintProjectId

   /**
    * ULIDs assigned to each task, in index-parallel order with the request's taskUnits.
    *
    * `taskIds[i]` corresponds to `request.taskUnits[i]`
    *
    * Use these identifiers for:
    * - Correlating completed results with original request items
    * - Querying individual task status
    * - Retrieving individual task outputs
    */
   taskIds: PaintTaskId[]

   /**
    * Timestamp when the project was accepted (jobs enqueued).
    */
   acceptedAt: number

   /**
    * Total number of tasks enqueued.
    * (Convenience field - equals taskIds.length)
    */
   taskCount: number
}
