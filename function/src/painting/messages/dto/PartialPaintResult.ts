import {
   CanvasFragment,
   SizedPixelsString,
   PaintProjectId,
   PaintTaskId,
} from "../values/index.js"

export interface PartialPaintResult {
   readonly taskId: PaintTaskId
   readonly projectId?: PaintProjectId
   readonly canvasFragment: CanvasFragment
   readonly pixelDataString: SizedPixelsString
}
