import { IRegionPlotBuilder } from "./IRegionPlotBuilder.js"

export interface IRegionMap {
  director: (plotter: IRegionPlotBuilder) => void

  readonly pixelHeight: number
  readonly pixelWidth: number
  readonly columnOrderedXCoordinates: number[]
  readonly columnOrderedYCoordinates: number[]
  readonly isUniform: boolean
}
