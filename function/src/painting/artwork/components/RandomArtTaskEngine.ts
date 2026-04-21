import { PlotDataCIDRef } from "./../../messages/values/PlotDataRef"
import { Inject, Injectable, Logger } from "@nestjs/common"

import { PaintingModuleTypes } from "../di/Types.js"
import type {
   IRegionMap,
   IRegionMapRepository,
} from "../../../plotting/interface/index.js"

import { GenModelArtist } from "./GenModelArtist.js"
import type { IGenModelProvider } from "../interface/IGenModelProvider.js"
import {
   PartialPaintRequest,
   PartialPaintResult,
} from "../../messages/dto/index.js"
import {
   CanvasFragment,
   GenModelSeed,
   PaintResolution,
   RawPixelData as RawPixelsData,
} from "../../messages/values/index.js"
import { hasRefByCID } from "../../messages/values/PlotDataRef.js"
import { CIDUtil } from "../../utility/CIDUtil.js"
import { CID } from "multiformats"
import { NominalUtil } from "../../messages/components/NominalUtil.js"

// Helper to decode base64 string to Uint8ClampedArray
function decodeBase64ToBytes(base64: string): Uint8ClampedArray {
   const buffer = Buffer.from(base64, "base64")
   return new Uint8ClampedArray(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength,
   )
}

@Injectable()
export class RandomArtTaskEngine {
   private readonly logger: Logger = new Logger("RandomArtTaskEngine")

   public constructor(
      @Inject(PaintingModuleTypes.InjectedRegionMapRepository)
      private readonly regionMapRepository: IRegionMapRepository,
      @Inject(PaintingModuleTypes.InjectedGenModelProvider)
      private readonly genModelProvider: IGenModelProvider,
   ) {}

   /**
    * Force the service to complete by closing the Channel with its input requests.
   public async onApplicationShutdown(): Promise<void> {}
    */

   public async performPaintTask(
      nextTask: PartialPaintRequest,
      logger: Logger,
   ): Promise<PartialPaintResult> {
      logger.log("RandomArtTaskEngine handling call for", nextTask)
      const { genSeed, plotDataRef, canvasFragment } = nextTask
      // if (!hasRefByCID(plotDataRef)) {
      // throw new Error("Paint Task must refer to a RegionMap by CIDString")
      // }

      // Decode base64 seeds to binary and create model via provider
      const genModel = this.genModelProvider.createModel(
         typeof genSeed.seedPrefix === "string"
            ? decodeBase64ToBytes(genSeed.seedPrefix)
            : genSeed.seedPrefix,
         typeof genSeed.seedSuffix === "string"
            ? decodeBase64ToBytes(genSeed.seedSuffix)
            : genSeed.seedSuffix,
      )
      try {
         // Parse the CID now that we have passed the point of serialization!
         const regionMapRefAsCID: CID = CIDUtil.toCID(plotDataRef.regionMapCID)
         const regionMap: IRegionMap =
            await this.regionMapRepository.load(regionMapRefAsCID)
         const initialY: number = canvasFragment.fragmentFirstRow
         const finalY: number = Math.min(
            regionMap.pixelHeight / regionMap.pixelSize,
            canvasFragment.fragmentLastRow + 1,
         )
         // Allocate a new buffer for an array of 32-bit pixels
         const pixelCount =
            (finalY - initialY) * regionMap.pixelWidth * regionMap.pixelSize
         const pixel32Data: Uint32Array = new Uint32Array(pixelCount)
         const artist: GenModelArtist = new GenModelArtist(
            genModel,
            pixel32Data,
            regionMap.pixelWidth / regionMap.pixelSize,
            initialY,
            finalY,
            regionMap.pixelSize,
         )
         logger.log("Initiating plot run")
         await regionMap.directPlotter(artist, initialY, finalY)

         // Re-wrap the original buffer of 32-bit words with 8-bit word boundaries for no-copy reuse as eight-bit pixel data.
         const pixel8Data: Uint8ClampedArray = new Uint8ClampedArray(
            pixel32Data.buffer,
            pixel32Data.byteOffset,
            pixel32Data.byteLength,
         )

         // Create fragment-specific resolution for blessing pixel data
         const fragmentPixelsData: RawPixelsData = {
            data: pixel8Data,
            pixelWidth: regionMap.pixelWidth,
            pixelHeight: finalY - initialY,
         }

         NominalUtil.assertPixelsData(fragmentPixelsData)

         const retVal: PartialPaintResult = {
            taskId: nextTask.taskId,
            canvasFragment: nextTask.canvasFragment,
            pixelDataString: NominalUtil.fromPixelsData(fragmentPixelsData),
         }
         if (nextTask.projectId != null) {
            return {
               ...retVal,
               projectId: nextTask.projectId,
            }
         }
         return retVal
      } catch (error) {
         logger.error("Error processing task:", error)
         throw error
      }
   }
}
