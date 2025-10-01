import { Canvas, CanvasRenderingContext2D, ImageData } from "canvas"
import { computePixel, GenModel } from "./genjs6.js"
import { IRegionPlotter } from "../../plotting/interface/IRegionPlotter.js"

// const CHARS: string[] = "0123456789ABCDEF".split("")
// const BYTES: string[] = Array(256)
// for (let ii = 0, idx = 0; ii < 16; ii++) {
//    for (let jj = 0; jj < 16; jj++, idx++) {
//       BYTES[idx] = `${CHARS[ii]}${CHARS[jj]}`
//    }
// }
// const COLORS: string[] = Array(256 * 256 * 256)
// for (let ii = 0, idx = 0; ii < 256; ii++) {
//    for (let jj = 0; jj < 256; jj++) {
//       for (let kk = 0; kk < 256; kk++, idx++) {
//          COLORS[idx] = `#${BYTES[ii]}${BYTES[jj]}${BYTES[kk]}`
//       }
//    }
// }

const ALPHA_OPAQUE = 255 << 24
const BLUE_SHIFT: number = 16
const GREEN_SHIFT: number = 8

export class GenModelArtist implements IRegionPlotter {
   private readonly context: CanvasRenderingContext2D
   private readonly imageData: ImageData
   private readonly pixelData: Uint32Array
   private plotIndex: number

   public constructor(
      private readonly genModel: GenModel,
      private readonly canvas: Canvas,
      private readonly initialY: number,
      private readonly finalY: number,
   ) {
      this.context = canvas.getContext("2d", {
         alpha: false,
         pixelFormat: "RGB24",
      })
      if (this.context === null) {
         throw new Error("Canvas failed to return a 2D context object?")
      }
      this.imageData = this.context.createImageData(
         canvas.width,
         this.finalY - this.initialY,
      )
      this.pixelData = new Uint32Array(this.imageData.data.buffer)
      this.plotIndex = canvas.width * this.initialY
   }

   public plot(regionX: number, regionY: number): void {
      // console.log(`${pixelX}, ${pixelY}) => (${regionX}, ${regionY}) => ${rgb} => ${strv}`)
      // this.painter.paint(pixelX, pixelY, `#${BYTES[rgb[0]]}${BYTES[rgb[1]]}${BYTES[rgb[2]]}`)
      // this.painter.paint(pixelX, pixelY, COLORS[(rgb[0] << 16) + (rgb[1] << 8) + rgb[2]]
      const rgb = computePixel(this.genModel, regionX, regionY)
      // this.context.fillStyle = COLORS[(rgb[0] << 16) | (rgb[1] << 8) | rgb[2]]
      // this.context.fillRect(pixelX, pixelY, 1, 1)
      // const index = (pixelY * this.canvas.width + pixelX) * 4
      this.pixelData[this.plotIndex++] =
         ALPHA_OPAQUE |
         (rgb[2] << BLUE_SHIFT) |
         (rgb[1] << GREEN_SHIFT) |
         rgb[0]
   }

   public finish(): void {
      // Draw the data onto the canvas
      this.context.putImageData(this.imageData, 0, this.initialY)
   }
}
