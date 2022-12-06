import { IPixelPainter } from "../interface/index.js"
import { computePixel, GenModel } from "./genjs6.js"
import { PlotBuilderArtistBridge } from "./PlotBuilderArtistBridge.js"

const CHARS: string[] = "0123456789ABCDEF".split("")
const BYTES: string[] = Array(256)
for (let ii = 0, idx = 0; ii < 16; ii++) {
  for (let jj = 0; jj < 16; jj++, idx++) {
    BYTES[idx] = `${CHARS[ii]}${CHARS[jj]}`
  }
}
export class GenModelArtist extends PlotBuilderArtistBridge {
  public constructor (
    private readonly genModel: GenModel,
    readonly painter: IPixelPainter,
  ) {
    super(painter)
  }

  public plot (pixelX: number, pixelY: number, regionX: number, regionY: number): void {
    const rgb = computePixel(this.genModel, regionX, regionY)
    // console.log(`${pixelX}, ${pixelY}) => (${regionX}, ${regionY}) => ${rgb} => ${strv}`)
    this.painter.paint(pixelX, pixelY, `#${BYTES[rgb[0]]}${BYTES[rgb[1]]}${BYTES[rgb[2]]}`)
  }
}
