import { PaintGeometry } from "../../../messages/interface/NamedValues.js"
import {
   PaintingTask,
   PaintProjectId,
   PaintTaskId,
   PlotMapGeometry,
} from "../values/index.js"
import { PlotDataCIDRef } from "../values/PlotDataRef.js"

export interface GatherPaintedPartsRequest<
   PaintingDomain extends object = object,
   ProjectDomain extends object = never,
> {
   /**
    * Every paint task is assigned a PaintTaskId when scheduled by the RandomArt
    * intake orchestrator.
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
   readonly paintTask: PaintingTask<PaintingDomain, PlotDataCIDRef>

   readonly paintGeometry: PaintGeometry

   /**
    * This is the row count of how many PartialPaintRequest's this
    * artwork's entire row set was distributed to during flow
    * orchestration bootstrap.
    */
   readonly expectedPartCount: number

   /**
    * Not every paint task is part of a multi-task project, but if this
    * task is, that project's domain model will be provided here.
    *
    * TODO: If the origin acquires a persistence-backed cache, this will
    *       only need to be copied into each DTO when using the worker pool.
    */
   readonly projectDomain?: ProjectDomain
}
