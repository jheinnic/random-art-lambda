import { IPixelPainter } from "../interface/IPixelPainter"

abstract class PlotBuilderArtistBridge implements IRegionPlotBuilder {
  protected constructor (protected readonly painter: IPixelPainter) { }

  public abstract plot (pixelX: number, pixelY: number, regionX: number, regionY: number): void

  public finish (): void {
    this.painter.finish()
  }
}
