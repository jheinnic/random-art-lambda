import { IRegionPlotter } from "./IRegionPlotter.js"

export interface IRegionMap {
    get pixelHeight(): number
    get pixelWidth(): number
    director( plotter: IRegionPlotter ): void
}
