import { PaintResolution } from "./PaintResolution.js"
import { SpatialBoundary } from "./SpatialBoundary.js"

export interface PlotMapGeometry {
   /**
    * Coordinate data that determines what range of the seeded GenModel's
    * infinite plane will be rendered.
    */
   readonly boundary: SpatialBoundary

   /**
    * Coordinate data that determines what resolution RandomArt will
    * plot its spatial boundaries at.
    */
   readonly imageSize: PaintResolution
}
