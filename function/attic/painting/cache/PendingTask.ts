import { PaintGeometry } from "../../../src/messages/interface/NamedValues.js"
import { PaintingTask } from "../../../src/painting/messages/values/PaintingTask.js"
import { PlotDataCIDRef } from "../../../src/painting/messages/values/PlotDataRef.js"

export interface PendingTask<PaintingDomain extends object>
   extends PaintingTask<PaintingDomain, PlotDataCIDRef> {
   paintGeometry: PaintGeometry
}
