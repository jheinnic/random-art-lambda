import { IPixelPainter } from "../interface/IPixelPainter.js"
import { IRegionPlotter } from "../interface/IRegionPlotter.js"
import pkg from "./genjs6.cjs"

// import { GenModel } from "./genjs6"
const { computePixel, GenModel } = pkg

export class GenModelPlotter implements IRegionPlotter {
  public constructor (
    private readonly genModel: GenModel,
    private readonly painter: IPixelPainter
  ) { }

  public plot (pixelX: number, pixelY: number, regionX: number, regionY: number): void {
    this.painter.paint(
      pixelX, pixelY, computePixel(this.genModel, regionX, regionY).reduce(
        (acc: string, x: number) => acc + x.toString(16), "#"
      )
    )
  }

  public finish (): void {
    this.painter.finish()
  }
}
