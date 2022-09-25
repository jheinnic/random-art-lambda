// import "@reactivex/ix-ts/add/iterable-operators/map"
import { IPoint, IRegionPlotter } from "../painting/interface"
import { PointPlotData } from "../plotting/protobuf/plot_mapping_pb.mjs"

type IPointMap = [region: IPoint, pixel: IPoint]

export class Bench02Model {
  public readonly storedMap: IPointMap[]

  constructor (private readonly _data: PointPlotData) {
    // this.storedPixels = [...this.getPixels()]
    // this.storedRegions = [...this.getRegions()]
    this.storedMap = [...zipCheap(this.getRegions(), this.getPixels())]
  }

  * getRegionRows (): IterableIterator<number> {
    const rows = this._data.getRowsList()
    if (this._data.getUniform() === true) {
      const nCols = this.getPixelWidth()
      for (let ii = 0; ii < nCols; ii++) {
        for (const jj of rows) {
          yield jj
        }
      }
    } else {
      for (const jj of rows) {
        yield jj
      }
    }
  }

  * getRegionCols (): IterableIterator<number> {
    const cols = this._data.getColumnsList()
    if (this._data.getUniform() === true) {
      const nRows = this.getPixelHeight()
      for (const ii of cols) {
        for (let jj = 0; jj < nRows; jj++) {
          yield ii
        }
      }
    } else {
      for (const ii of cols) {
        yield ii
      }
    }
  }

  * getRegions (): IterableIterator<IPoint> {
    const rows = this._data.getRowsList()
    const cols = this._data.getColumnsList()
    if (this._data.getUniform() === true) {
      for (const ii of cols) {
        for (const jj of rows) {
          yield [jj, ii]
        }
      }
    } else {
      let ii = 0
      const pixelCount = rows.length
      while (ii < pixelCount) {
        yield [rows[ii], cols[ii]]
        ii = ii + 1
      }
      // yield * zipCheap(xRegion[Symbol.iterator](), yRegion[Symbol.iterator]())
    }
  }

  * getPixelRows (): IterableIterator<number> {
    const nRows = this.getPixelHeight()
    const nCols = this.getPixelWidth()
    for (let ii = 0; ii < nCols; ii++) {
      for (let jj = 0; jj < nRows; jj++) {
        yield jj
      }
    }
  }

  * getPixelCols (): IterableIterator<number> {
    const nRows = this.getPixelHeight()
    const nCols = this.getPixelWidth()
    for (let ii = 0; ii < nCols; ii++) {
      for (let jj = 0; jj < nRows; jj++) {
        yield ii
      }
    }
  }

  * getPixels (): IterableIterator<IPoint> {
    const nRows = this.getPixelHeight()
    const nCols = this.getPixelWidth()
    for (let ii = 0; ii < nCols; ii++) {
      for (let jj = 0; jj < nRows; jj++) {
        yield [jj, ii]
      }
    }
  }

  getPixelHeight (): number {
    const data = this._data
    return data.getResolution()?.getPixelheight() ?? data.getRowsList().length
  }

  getPixelWidth (): number {
    const data = this._data
    return (
      data.getResolution()?.getPixelwidth() ?? data.getColumnsList().length
    )
  }

  [Symbol.iterator] (): IterableIterator<IPointMap> {
    const xRegionIter = this.getRegionRows()
    const yRegionIter = this.getRegionCols()
    const xyRegionIter: IterableIterator<IPoint> = zipCheap(
      xRegionIter,
      yRegionIter
    )

    // const xPixelIter = this.getPixelRows();
    // const yPixelIter = this.getPixelCols();
    // const xyPixelIter: IterableIterator<[number, number]> = zipCheap(xPixelIter, yPixelIter);
    const xyPixelIter: IterableIterator<IPoint> = this.getPixels()

    return zipCheap(xyPixelIter, xyRegionIter)
  }

  iter2 (): IterableIterator<IPointMap> {
    return zipCheap(
      this.getRegions(), this.getPixels()
    )
  }

  iter3 (): IterableIterator<IPointMap> {
    return zipCheap(
      zipCheap(this.getRegionRows(), this.getRegionCols()),
      zipCheap(this.getPixelRows(), this.getPixelCols())
    )
  }

  directOne (plotter: IRegionPlotter): void {
    const xMax: number = this.getPixelWidth()
    const yMax: number = this.getPixelHeight()
    const rows: number[] = this._data.getRowsList()
    const cols: number[] = this._data.getColumnsList()
    let nextX: number = -1
    let nextY: number = -1

    // for (const nextXY of xyRegionIter) {
    if (this._data.getUniform() === true) {
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
          plotter.plot(nextX++, nextY, cols[ii], rows[ii++])
        }
      }
    }
  }
}

// type IteratorOf<I extends Iterator<unknown>> = I extends Iterator<infer T>
// ? T
// : never
// type IteratorOf<I extends Iterator<T>, T = any> = T // I extends Iterator<infer T> ? T : never;

type TupleMapper<Tuple extends Array<Iterator<unknown>>> = {
  [Key in keyof Tuple]: Tuple[Key] extends Iterator<infer T> ? T : never;
}

const count = 0
function * zipCheap<T, Tuple extends Array<Iterator<T>>> (
  ...iterators: Tuple
): IterableIterator<TupleMapper<Tuple>> {
  let hasMore: boolean = true
  function onNext (nextIter): T {
    const result = nextIter.next()
    if (result.done === true) {
      hasMore = false
      // console.log("Done!")
    // } else {
      // console.log(result)
    }
    return result.value
  }
  let retVal: TupleMapper<Tuple> = iterators.map(onNext)
  while (hasMore) {
    // console.log(`Sending ${retVal.toString()}`)
    yield retVal
    retVal = iterators.map(onNext)
    // if (!hasMore) {
    // console.log(`Skipping ${retVal.toString()}`)
    // }
  }
}
