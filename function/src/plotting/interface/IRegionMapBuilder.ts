import {
   RegionBoundaries,
   RegionBoundaryFractions,
} from "../ipld/ipldmodel/index.js"

export interface IRegionMapBuilder {
   pixelRef: (pixelRef: "Center" | "TopLeft") => IRegionMapBuilder
   imageSize: (width: number, height: number) => IRegionMapBuilder
   // chunkHeight: ( height: number ) => IRegionMapBuilder
   regionBoundary: {
      (boundary: RegionBoundaries): IRegionMapBuilder
      (boundary: RegionBoundaryFractions): IRegionMapBuilder
   }
   xByRows: (rowOrderX: readonly number[]) => IRegionMapBuilder
   yByRows: (rowOrderY: readonly number[]) => IRegionMapBuilder
}
