import { PixelsString } from "../../../messages/interface/index.js"
import {
   CanvasFragment,
   PaintProjectId,
   PaintResolution,
   PaintTaskId,
} from "../values/index.js"

export interface PartialPaintResult {
   readonly taskId: PaintTaskId
   readonly projectId?: PaintProjectId
   readonly canvasFragment: CanvasFragment
   readonly fragmentGeometry: PaintResolution
   readonly pixelData: PixelsString
}
