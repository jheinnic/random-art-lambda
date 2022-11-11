import { IRegionPlotBuilder } from "./IRegionPlotBuilder.js"

export interface IRegionMap {
  director: (plotter: IRegionPlotBuilder) => void
}
