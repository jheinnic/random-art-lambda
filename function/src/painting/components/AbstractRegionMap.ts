import { IRegionMap, IRegionPlotter } from "../../painting/interface"

// import { TupleOfLength } from "@jchptf/tupletypes"

export abstract class AbstractRegionMap implements IRegionMap {
  abstract get pixelHeight (): number

  abstract get pixelWidth (): number

  abstract get regionRows (): number[]

  abstract get regionColumns (): number[]

  abstract get isUniform (): boolean

  public drive (plotter: IRegionPlotter): void {
    const xMax: number = this.pixelWidth
    const yMax: number = this.pixelHeight
    const rows: number[] = this.regionRows
    const cols: number[] = this.regionColumns
    let nextY: number = -1
    let nextX: number

    // plotter.init(xMax, yMax)

    // for (const nextXY of xyRegionIter) {
    if (this.isUniform) {
      while (++nextY < yMax) {
        nextX = -1
        while (++nextX < xMax) {
          plotter.plot(nextX, nextY, cols[nextX], rows[nextY])
        }
      }
    } else {
      let ii: number = 0
      while (++nextY < yMax) {
        nextX = -1
        while (++nextX < xMax) {
          plotter.plot(nextX, nextY, cols[ii], rows[ii++])
        }
      }
    }
    plotter.finish()
  }
}
