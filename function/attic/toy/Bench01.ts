import { vsprintf } from "sprintf-js"

function * getPixels (
  nRows: number,
  nCols: number,
  nLayers: number
): IterableIterator<[number, number, number]> {
  const pixel: [number, number, number] = [0, 0, 0]
  for (let ii = 0; ii < nCols; ii++) {
    pixel[2] = ii
    for (let jj = 0; jj < nRows; jj++) {
      pixel[1] = jj
      for (let kk = 0; kk < nLayers; kk++) {
        pixel[0] = kk
        yield pixel
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (_: any): void => {}

function useNoop (nRows: number, nCols: number, nLayers: number): void {
  for (const point of getPixels(nRows, nCols, nLayers)) {
    noop(point)
  }
}

function useVsprintf (nRows: number, nCols: number, nLayers: number): void {
  for (const point of getPixels(nRows, nCols, nLayers)) {
    vsprintf("rgb(%d,%d,%d)", point)
  }
}

function useReduce (nRows: number, nCols: number, nLayers: number): void {
  for (const point of getPixels(nRows, nCols, nLayers)) {
    point.reduce((acc, x) => acc + x.toString(16), "#")
  }
}

function useMap (nRows: number, nCols: number, nLayers: number): void {
  for (const point of getPixels(nRows, nCols, nLayers)) {
    noop("#" + point.map((x) => x.toString(16)).join(""))
  }
}

const loops = parseInt(process.argv[3])
switch (process.argv[2]) {
  case "noop": {
    for (let ii = 0; ii < loops; ii++) {
      useNoop(256, 256, 64)
    }
    break
  }
  case "vsprintf": {
    for (let ii = 0; ii < loops; ii++) {
      useVsprintf(256, 256, 64)
    }
    break
  }
  case "map": {
    for (let ii = 0; ii < loops; ii++) {
      useMap(256, 256, 64)
    }
    break
  }
  case "reduce": {
    for (let ii = 0; ii < loops; ii++) {
      useReduce(256, 256, 64)
    }
    break
  }
  default: {
    console.error("Unknown: " + process.argv[2])
  }
}
