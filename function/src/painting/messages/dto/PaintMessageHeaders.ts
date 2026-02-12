import { ReleaseVersion } from "../../../messages/components/ReleaseVersion.js"
import { PaintProjectId } from "../values/PaintProjectId.js"
import { PaintTaskId } from "../values/PaintTaskId.js"

interface PaintProjectMessage {
   projectId: PaintProjectId
}

interface PaintTaskMessage {
   taskId: PaintTaskId
   projectId?: PaintProjectId
}

export const PaintProjectHeadersMap = {
   PAINT_PROJECT_ID: "projectId" as const,
}

export const PaintTaskHeadersMap = {
   PAINT_TASK_ID: "taskId" as const,
   PAINT_PROJECT_ID: "projectId" as const,
}

export type PaintProjectHeaders = keyof typeof PaintProjectHeadersMap
export type PaintTaskHeaders = keyof typeof PaintTaskHeadersMap

export const CURRENT_RELEASE: ReleaseVersion = ReleaseVersion.parse("1.0.0")
