import { RegionBoundaries, RegionBoundaryFractions } from "./RegionMapSchemaTypes.js"

export interface IRegionMapBuilder {
  pixelRef: ( pixelRef: "Center" | "TopLeft" ) => IRegionMapBuilder
  imageSize: ( width: number, height: number ) => IRegionMapBuilder
  chunkHeight: ( height: number ) => IRegionMapBuilder
  regionBoundary: ( boundary: RegionBoundaries | RegionBoundaryFractions ) => IRegionMapBuilder
  xByRows: ( rowOrderX: number[] ) => IRegionMapBuilder
  yByRows: ( rowOrderY: number[] ) => IRegionMapBuilder
}
