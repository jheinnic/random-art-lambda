import type { IGenModel } from "../interface/IGenModelProvider.js"
import { IRegionPlotter } from "../../../plotting/interface/IRegionPlotter.js"

const ALPHA_OPAQUE = 255 << 24
const BLUE_SHIFT: number = 16
const GREEN_SHIFT: number = 8

/**
 * GenModelArtist implements IRegionPlotter to paint pixels using a generative model.
 *
 * This class works with any IGenModel implementation, allowing use of different
 * art generation backends (genjs6, randomart, etc.).
 */
export class GenModelArtist implements IRegionPlotter {
   private plotIndex: number

   public constructor(
      private readonly genModel: IGenModel,
      private readonly pixelData: Uint32Array,
      private readonly canvasWidth: number,
      private readonly initialY: number,
      private readonly finalY: number,
      private readonly pixelSize: number,
   ) {
      if (pixelSize !== 1) {
         throw new Error(
            `Only pixelSize == 1 is currently supported, but received ${pixelSize}`,
         )
      }
      this.plotIndex = 0
   }

   public plot(regionX: number, regionY: number): void {
      const rgb: [number, number, number] = this.genModel.computePixel(
         regionX,
         regionY,
      )
      this.pixelData[this.plotIndex++] =
         ALPHA_OPAQUE |
         (rgb[2] << BLUE_SHIFT) |
         (rgb[1] << GREEN_SHIFT) |
         rgb[0]
   }

   public finish(): void {
      // Draw the data onto the canvas
      const finalIndex = this.canvasWidth * (this.finalY - this.initialY)
      if (this.plotIndex !== finalIndex) {
         throw new Error(
            `Plotting did not iterate to ${finalIndex}, but rather to ${this.plotIndex}`,
         )
      }
   }
}
