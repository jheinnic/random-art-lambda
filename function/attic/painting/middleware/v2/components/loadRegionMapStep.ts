/**
 * RenderExecutor - actually renders the image during produce()
 * - Requires: dimensions, seed, format (all derived earlier)
 * - Produces: imageBuffer (the actual rendered image)
 */

import { Extend } from "zod/v4/core/util.cjs"
import { IRegionMap, IRegionMapRepository } from "../../../plotting/index.js"
import { GenModelSeed } from "../../messages/values/index.js"
import { PlotDataCIDRef } from "../../messages/values/PlotDataRef.js"
import { CIDUtil } from "../../utility/CIDUtil.js"
import { LoadedRegionMap } from "../types/LoadedRegionMap.js"

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createRegionMapLoader(regionMapRepo: IRegionMapRepository) {
   type RequiredState = PlotDataCIDRef & GenModelSeed

   return class RenderExecutor {
      static readonly _requires: RequiredState
      static readonly _produces: LoadedRegionMap

      // This is where the actual rendering happens!
      static async produce(state: RequiredState): Promise<LoadedRegionMap> {
         const startTime: number = Date.now()
         const regionMap = await regionMapRepo.load(
            CIDUtil.toCID(state.regionMapCID),
         )
         return {
            regionMap,
            regionMapLoadTimeMs: Date.now() - startTime,
         }
      }

      static bind(
         context: Extend<LoadedRegionMap, RequiredState>,
      ): RenderExecutor {
         return new RenderExecutor(context)
      }

      private constructor(
         private readonly context: Extend<LoadedRegionMap, RequiredState>,
      ) {}

      get regionMap(): IRegionMap {
         return this.context.regionMap
      }

      get regionMapLoadTimeMs(): number {
         return this.context.regionMapLoadTimeMs
      }
   }
}
