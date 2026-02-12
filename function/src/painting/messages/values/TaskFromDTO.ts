import { PaintingTask } from "../../messages/values/PaintingTask.js"
import { PlotDataCIDRef } from "../../messages/values/PlotDataRef.js"

export interface TaskFromDTO {
   paintTask: PaintingTask<any, PlotDataCIDRef>
}
