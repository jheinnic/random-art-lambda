import { PaintGeometry } from "../../../messages/interface/index.js"
import { PlotDataCIDRef } from "../values/PlotDataRef.js"
import {
   CanvasFragment,
   PaintingTask,
   PaintProjectId,
   PaintTaskId,
} from "../values/index.js"

export interface PartialPaintRequest {
   /**
    * Every paint task is assigned a ULID by !i
    */
   readonly taskId: PaintTaskId

   /**
    * Not every paint task is part of a multi-task project, but if this
    * task is, that project's projectId will be provided here.
    */
   readonly projectId?: PaintProjectId
   /**
    * All the metadata from the PaintingTask this request targets a
    * subset of the rows from.   The PlotDataRef has been fully expanded
    * to include any name, the CID for loading its plot points, and a
    * copy of its RegionBoundary and SpatialDimensions for convenience.
    */
   readonly paintTask: PaintingTask<PaintGeometry, PlotDataCIDRef>

   /**
    * Additional metadata that selects a subset of the overall task rows
    * that the worker receiving this task is being asked to render
    * and return (bia PartialPaintResult)
    */
   readonly canvasFragment: CanvasFragment
}
