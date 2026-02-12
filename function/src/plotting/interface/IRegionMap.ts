import { IRegionPlotter } from "./IRegionPlotter.js"
import { IRegionMapBuilder } from "./IRegionMapBuilder.js"

export interface IRegionMap {
   get pixelHeight(): number
   get pixelWidth(): number
   get pixelSize(): number
   get columnOrderedXCoordinates(): readonly number[]
   get columnOrderedYCoordinates(): readonly number[]
   get regionBoundary(): {
      top: number
      bottom: number
      left: number
      right: number
   }
   directPlotter: (
      plotter: IRegionPlotter,
      fromY: number,
      untilY: number,
   ) => Promise<void>
   oldDirectPlotter: (plotter: IRegionPlotter) => Promise<void>
   directBuilder: (builder: IRegionMapBuilder) => void
}
