import { IPixelPainter } from "../interface/IPixelPainter.js"
import { IRegionPlotter } from "../interface/IRegionPlotter.js"
import { computePixel, GenModel } from "./genjs6.js"

export class GenModelPlotter implements IRegionPlotter {
  public constructor (
    private readonly genModel: GenModel,
    private readonly painter: IPixelPainter
  ) { }

  public plot (pixelX: number, pixelY: number, regionX: number, regionY: number): void {
    const rgb = computePixel(this.genModel, regionX, regionY)
    const strv = rgb.reduce(
      (acc: string, x: number) => {
        const colorByte = x.toString(16)
        if (x < 16) {
          return `${acc}0${colorByte}`
        }
        return `${acc}${colorByte}`
      }, "#")
    // console.log(`${pixelX}, ${pixelY}) => (${regionX}, ${regionY}) => ${rgb} => ${strv}`)
    this.painter.paint(pixelX, pixelY, strv)
  }

  public finish (): void {
    this.painter.finish()
  }
}
