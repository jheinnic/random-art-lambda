import { PlotDataCIDRef } from "../values/PlotDataRef.js"
import {
   CanvasFragment,
   GenModelSeed,
   ValidPaintGeometry,
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

   /*
    * Seed data for the GenModel artifact that determines what is painted from the
    * location defined by plotDataRef.
    */
   readonly genSeed: GenModelSeed

   /**
    * Reference to what plane will be rendered, and at what resolution.  Any
    * local name alias has by now been resolved to appear with its well-formed CID.
    */
   readonly plotDataRef: PlotDataCIDRef

   /**
    * Geometry of the region described by plotDataRef, and validated by
    * assertValidPaintGeometry()
   readonly paintGeometry: ValidPaintGeometry
    */

   /**
    * Additional metadata that selects a subset of the overall task rows
    * that the worker receiving this task is being asked to render
    * and return (bia PartialPaintResult)
    */
   readonly canvasFragment: CanvasFragment
}
