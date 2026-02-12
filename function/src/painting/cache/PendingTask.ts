import { PaintGeometry } from "../../messages/interface/NamedValues.js"
import { PaintingTask } from "../messages/values/PaintingTask.js"
import { PlotDataCIDRef } from "../messages/values/PlotDataRef.js"

export interface PendingTask<PaintingDomain extends object>
   extends PaintingTask<PaintingDomain, PlotDataCIDRef> {
   paintGeometry: PaintGeometry
}
