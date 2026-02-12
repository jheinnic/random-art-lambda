import { PaintProjectId } from "../values/PaintProjectId.js"

export interface GatherProjectTasksRequest<ProjectDomain extends object> {
   readonly projectId: PaintProjectId
   readonly expectedTaskCount: number
   readonly projectDomain: ProjectDomain
}
