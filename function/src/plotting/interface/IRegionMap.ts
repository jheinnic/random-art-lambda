import { IRegionPlotter } from "./IRegionPlotter.js"
import { IRegionMapBuilder } from "./IRegionMapBuilder.js"

export interface IRegionMap {
   get pixelHeight(): number
   get pixelWidth(): number
   get columnOrderedXCoordinates(): readonly number[]
   get columnOrderedYCoordinates(): readonly number[]
   directPlotter: (plotter: IRegionPlotter) => Promise<void>
   oldDirectPlotter: (plotter: IRegionPlotter) => Promise<void>
   directBuilder: (builder: IRegionMapBuilder) => void
}
