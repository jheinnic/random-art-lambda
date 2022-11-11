import { IRegionMap, IRegionPlotBuilder } from "../interface/index.js"

// import { TupleOfLength } from "@jchptf/tupletypes"

export abstract class AbstractRegionMap implements IRegionMap {
  abstract get pixelHeight (): number

  abstract get pixelWidth (): number

  abstract get regionRows (): number[]

  abstract get regionColumns (): number[]

  abstract get isUniform (): boolean

  public director (plotter: IRegionPlotBuilder): void {
    const xMax: number = this.pixelWidth
    const yMax: number = this.pixelHeight
    const xCols: number[] = this.regionRows
    const yCols: number[] = this.regionColumns
    let nextX: number = -1
    let nextY: number

    // plotter.init(xMax, yMax)

    // for (const nextXY of xyRegionIter) {
    if (this.isUniform) {
      while (++nextX < xMax) {
        nextY = -1
        while (++nextY < yMax) {
          plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY])
        }
      }
    } else {
      let ii: number = 0
      while (++nextX < xMax) {
        nextY = -1
        console.log("New Col")
        while (++nextY < yMax) {
          console.log(nextX, nextY, xCols[ii], yCols[ii])
          plotter.plot(nextX, nextY, xCols[ii], yCols[ii++])
        }
      }
    }
    plotter.finish()
  }
}
