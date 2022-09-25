import { Canvas, CanvasRenderingContext2D } from "canvas"

import { IPixelPainter } from "../interface/IPixelPainter.js"
import { computePixel } from "./genjs6.js"

export class CanvasPixelPainter implements IPixelPainter {
  private readonly context: CanvasRenderingContext2D

  public constructor (
    private readonly canvas: Canvas,
    private readonly streamOut: WriteStream
  ) {
    this.context = canvas.getContext("2d")
    if (this.context === null) {
      throw new Error("Canvas failed to return a 2D context object?")
    }
    this.streamOut.on("end", () => {
      console.log(`Wrote out png of {streamOut.bytesWritten} bytes`)
    })
  }

  public paint (pixelX: number, pixelY: number, color: string): void {
    this.context.fillStyle = color
    this.context.fillRect(pixelX, pixelY, 1, 1)
  }

  public finish (): void {
    const streamIn = this.canvas.createPNGStream()
    const streamOut = this.streamOut
    streamIn.on("error", (err: any) => {
      console.error(err)
      streamOut.close()
    })
    // streamIn.on("end", streamOut.close)
    streamIn.pipe(streamOut)
  }
}
