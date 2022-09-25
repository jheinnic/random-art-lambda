import { IRegionPlotter } from "./IRegionPlotter.js"

export interface IRegionMap {
  drive: (plotter: IRegionPlotter) => void
}
