import { Canvas, CanvasRenderingContext2D } from "canvas"

import { IPixelPainter } from "../interface/index.js"

export class CanvasPixelPainter implements IPixelPainter {
  private readonly context: CanvasRenderingContext2D
  private finished: boolean = false

  public constructor (private readonly canvas: Canvas) {
    this.context = canvas.getContext("2d")
    if (this.context === null) {
      throw new Error("Canvas failed to return a 2D context object?")
    }
  }

  public paint (pixelX: number, pixelY: number, color: string): void {
    if (this.finished) {
      throw new Error("Already done painting")
    }
    this.context.fillStyle = color
    this.context.fillRect(pixelX, pixelY, 1, 1)
  }

  public finish (): void {
    this.finished = true
  }

  public isDone (): boolean {
    return this.finished
  }

  public getCanvas (): Canvas {
    if (!this.finished) {
      throw new Error("Not finished painting yet.  Try again later.")
    }
    return this.canvas
  }
}
