import { Canvas } from "canvas"
import { CID } from "multiformats"
import { Readable } from "stream"

import { IRandomArtwork, Prefix, Suffix } from "../interface/index.js"

export class RandomArtwork implements IRandomArtwork {
  constructor (
    public readonly cid: CID,
    public readonly prefix: Prefix,
    public readonly suffix: Suffix,
    public readonly regionMap: CID,
    public readonly engineVersion: string,
    private readonly canvas: Canvas,
  ) { }

  public get buffer (): Buffer {
    const canvas: Canvas = this.canvas
    return canvas.toBuffer()
  }

  public get stream (): Readable {
    const canvas: Canvas = this.canvas
    return canvas.createPNGStream({ compressionLevel: 9 })
  }
}
