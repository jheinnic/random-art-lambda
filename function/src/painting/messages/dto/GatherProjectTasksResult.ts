import { PaintProjectId } from "../values/PaintProjectId.js"
import { PaintTaskId } from "../values/PaintTaskId.js"
import { TaskResultRecord } from "../values/TaskResultRecord.js"

export interface GatherProjectTasksResult {
   readonly projectId: PaintProjectId
   readonly resultsByTask: Record<PaintTaskId, TaskResultRecord>
   readonly resultsByGroup: Record<string, TaskResultRecord[]>
   readonly counters: {
      readonly totalTaskCount: number
      readonly numCompleted: number
      readonly numStaged: number
      readonly numCached: number
      readonly numIgnored: number
      readonly numFatalErrors: number
      readonly numSemanticErrors: number
      readonly numRetryFailures: number
   }
}
