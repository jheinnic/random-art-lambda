import { Canvas, CanvasRenderingContext2D } from "canvas"

import { ICompleteObserver, IPixelPainter } from "../interface/index.js"

export class CanvasPixelPainter implements IPixelPainter {
  private readonly context: CanvasRenderingContext2D

  public constructor (
    private readonly canvas: Canvas,
    private readonly onFinish: ICompleteObserver
  ) {
    this.context = canvas.getContext("2d")
    if (this.context === null) {
      throw new Error("Canvas failed to return a 2D context object?")
    }
  }

  public paint (pixelX: number, pixelY: number, color: string): void {
    this.context.fillStyle = color
    this.context.fillRect(pixelX, pixelY, 1, 1)
  }

  public finish (): void {
    this.onFinish.finish()
  }
}
