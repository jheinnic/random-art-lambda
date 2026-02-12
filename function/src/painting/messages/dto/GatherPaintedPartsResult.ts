import { PaintProjectId } from "../values/PaintProjectId.js"
import { PaintTaskId } from "../values/PaintTaskId.js"
import { TaskResultRecord } from "../values/TaskResultRecord.js"

export interface GatherPaintedPartsResult {
   readonly taskId: PaintTaskId
   readonly projectId?: PaintProjectId
   readonly result: TaskResultRecord
}
