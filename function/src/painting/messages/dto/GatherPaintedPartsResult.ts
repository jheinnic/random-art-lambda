import { PaintProjectId } from "../values/PaintProjectId.js"
import { PaintTaskId } from "../values/PaintTaskId.js"
import { TaskResultRecord } from "../values/TaskResultRecord.js"

/**
 * Result returned by the per-task gathering worker after assembling
 * painted parts into a final image and staging it.
 *
 * The optional `domainExtension` and `regionMapName` fields echo
 * domain context from the request, making it available to the
 * project-level gathering worker for manifest generation without
 * requiring it to re-derive the information.
 */
export interface GatherPaintedPartsResult<
   PaintingDomain extends object = object,
> {
   readonly taskId: PaintTaskId
   readonly projectId?: PaintProjectId
   readonly result: TaskResultRecord

   /** Domain extension echoed from the paint task request */
   readonly domainExtension?: PaintingDomain

   /** Region map name echoed from the paint task's plot data ref */
   readonly regionMapName?: string
}
