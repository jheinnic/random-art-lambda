import { Canvas } from "canvas"
import { CIDString } from "../messages/index.js"
import { GenModelSeed } from "../painting/messages/values/GenModelSeed.js"
import { PaintResolution } from "../painting/messages/values/PaintResolution.js"
import { PaintTaskId } from "../painting/messages/values/PaintTaskId.js"
import { PlotDataCIDRef } from "../painting/messages/values/PlotDataRef.js"
import { PlotMapGeometry } from "../painting/messages/values/PlotMapGeometry.js"
import { SpatialBoundary } from "../painting/messages/values/SpatialBoundary.js"
import { IRegionMap } from "../plotting/index.js"

export interface RawTaskDto {
   genModelSeed: GenModelSeed

   plotMapGeometry: PlotMapGeometry

   cidRef: PlotDataCIDRef
}

export interface IBaseContextModel
   extends GenModelSeed,
      SpatialBoundary,
      PaintResolution {
   taskId: PaintTaskId
   regionMapName: string
   regionMapCID: CIDString
}

export interface IRegionMapContextModel {
   regionMap: IRegionMap
}

export interface ICanvasContextModel {
   canvas: Canvas
}
