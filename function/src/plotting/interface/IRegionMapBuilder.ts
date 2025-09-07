type RefPoint = "Center" | "TopLeft"

type Boundary = "top" | "bottom" | "left" | "right"

type BoundaryFraction = `${Boundary}N` | `${Boundary}D`

type RegionBoundaries = Record<Boundary, number>

type RegionBoundaryFractions = Record<BoundaryFraction, number>

export interface IRegionMapBuilder {
   pixelRef: (pixelRef: RefPoint) => IRegionMapBuilder
   imageSize: (width: number, height: number) => IRegionMapBuilder
   // chunkHeight: ( height: number ) => IRegionMapBuilder
   regionBoundary: {
      (boundary: RegionBoundaries): IRegionMapBuilder
      (boundary: RegionBoundaryFractions): IRegionMapBuilder
   }
   xByRows: (rowOrderX: readonly number[]) => IRegionMapBuilder
   yByRows: (rowOrderY: readonly number[]) => IRegionMapBuilder
}
