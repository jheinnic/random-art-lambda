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
} from "../../messages/values/index.js"
import { hasRefByCID } from "../../messages/values/PlotDataRef.js"
import { CIDUtil } from "../../utility/CIDUtil.js"
import { CID } from "multiformats"
import { NominalUtil } from "../../../messages/components/NominalUtil.js"

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
      const { paintTask } = nextTask
      if (!hasRefByCID(paintTask.plotDataRef)) {
         throw new Error("Paint Task must refer to a RegionMap by CIDString")
      }
      const seedStrategy: GenModelSeed = paintTask.genSeed

      // Decode base64 seeds to binary and create model via provider
      const genModel = this.genModelProvider.createModel(
         typeof seedStrategy.seedPrefix === "string"
            ? decodeBase64ToBytes(seedStrategy.seedPrefix)
            : seedStrategy.seedPrefix,
         typeof seedStrategy.seedSuffix === "string"
            ? decodeBase64ToBytes(seedStrategy.seedSuffix)
            : seedStrategy.seedSuffix,
      )
      try {
         // Parse the CID now that we have passed the point of serialization!
         const regionMapRefAsCID: CID = CIDUtil.toCID(
            paintTask.plotDataRef.regionMapCID,
         )
         const regionMap: IRegionMap =
            await this.regionMapRepository.load(regionMapRefAsCID)
         const canvasFragment: CanvasFragment = nextTask.canvasFragment
         const initialY: number = canvasFragment.fragmentFirstRow
         const finalY: number = Math.min(
            regionMap.pixelHeight,
            canvasFragment.fragmentLastRow + 1,
         )
         // Allocate a new buffer for an array of 32-bit pixels
         const pixelCount = (finalY - initialY) * regionMap.pixelWidth
         const pixel32Data: Uint32Array = new Uint32Array(pixelCount)
         const artist: GenModelArtist = new GenModelArtist(
            genModel,
            pixel32Data,
            regionMap.pixelWidth,
            initialY,
            finalY,
         )
         logger.log("Initiating plot run")
         await regionMap.directPlotter(artist, initialY, finalY)

         // Re-wrap the original buffer of 32-bit words with 8-bit word boundaries for no-copy reuse as eight-bit pixel data.
         const pixel8Data: Uint8ClampedArray = new Uint8ClampedArray(
            pixel32Data.buffer,
         )

         // Create fragment-specific resolution for blessing pixel data
         const fragmentResolution: PaintResolution = {
            width: regionMap.pixelWidth,
            height: finalY - initialY,
            size: 1,
         }

         if (!NominalUtil.blessPixelsData(pixel8Data, fragmentResolution)) {
            throw new Error(
               `Failed to bless pixel data: expected ${4 * regionMap.pixelWidth * (finalY - initialY)} bytes`,
            )
         }

         return {
            taskId: nextTask.taskId,
            canvasFragment: nextTask.canvasFragment,
            fragmentGeometry: fragmentResolution,
            pixelData: NominalUtil.fromPixelsData(pixel8Data),
         }
      } catch (error) {
         logger.error("Error processing task:", error)
         throw error
      }
   }
}
