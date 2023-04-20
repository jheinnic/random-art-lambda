export interface IRegionPlotBuilder {
  /**
   * Builder method that plots a pixel at (pixelX, pixelY) by plotting a value from
   * target region at (regionX, regionY)
   */
  plot: (pixelX: number, pixelY: number, regionX: number, regionY: number) => void

  /**
   * Builder method that indicates all pixels have been plotted.
  finish: () => void
   */
}
