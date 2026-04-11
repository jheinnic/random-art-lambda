/**
 * RenderExecutor - actually renders the image during produce()
 * - Requires: dimensions, seed, format (all derived earlier)
 * - Produces: imageBuffer (the actual rendered image)
 */

import { Extend } from "zod/v4/core/util.cjs"
import { IRegionMap } from "../../../plotting/index.js"
import { PlotMapGeometry } from "../../messages/values/index.js"
import { LoadedRegionMap } from "../types/LoadedRegionMap.js"
import { Canvas } from "canvas"

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
type RequiredState = LoadedRegionMap

export class ReadPlotMapGeometry {
   static readonly _requires: RequiredState
   static readonly _produces: PlotMapGeometry

   // This is where the actual rendering happens!
   static produce(state: RequiredState): PlotMapGeometry {
      const spatialBoundary = state.regionMap.regionBoundary
      const paintResolution = {
         width: state.regionMap.pixelWidth,
         height: state.regionMap.pixelHeight,
         size: state.regionMap.pixelSize,
      }

      return {
         boundary: spatialBoundary,
         imageSize: paintResolution,
      }
   }

   static bind(
      context: Extend<PlotMapGeometry, RequiredState>,
   ): ReadPlotMapGeometry {
      return new ReadPlotMapGeometry(context)
   }

   private constructor(
      private readonly context: Extend<PlotMapGeometry, RequiredState>,
   ) {}

   allocateCanvas(): Canvas {
      throw new Error("TODO")
   }
}
