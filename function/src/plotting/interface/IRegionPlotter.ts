export interface IRegionPlotter {
   /**
    * Builder method that plots a pixel at (pixelX, pixelY) by plotting a value from
    * target region at (regionX, regionY).  Automatically iterates to the next pixel
    * in row-first order.   E.g. columns 0 through (maxWidth-1) are plotted, then we
    * advance y to the next row and iterate throw another cycle of 0 through
    * maxWidth until reaching y reaches (maxHeight-1) (a.k.a. maxDepth-1)
    */
   plot: (
      regionX: number,
      regionY: number,
   ) => void

   /**
    * Builder method that indicates all pixels have been plotted.
    */
   finish: () => void
}
