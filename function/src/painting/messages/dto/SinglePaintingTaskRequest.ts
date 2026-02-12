import { PaintingTask } from "../values/PaintingTask.js"
import { PlotDataCIDRef } from "../values/PlotDataRef.js"

export type SinglePaintingTaskRequest<PaintingDomain extends object> =
   PaintingTask<PaintingDomain, PlotDataCIDRef>
