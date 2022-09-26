import { BitInputStream, BitOutputStream } from "@thi.ng/bitstream"
import fractionPkg from "fraction.js"
import * as fs from "fs"

const { Fraction } = fractionPkg

export interface PixelSize {
  pixelWidth: number
  pixelHeight: number
}

export interface RegionBoundary {
  top: number
  bottom: number
  left: number
  right: number
}

// export type Palette = Bytes

export interface DataBlock {
  height: Int
  rowsN: Uint8Array
  rowsD: Uint8Array
  colsN: Uint8Array
  colsD: Uint8Array
}

export interface RegionMap {
  pixelRef: "Center" | "TopLeft"
  imageSize: PixelSize
  chunkHeight: Int
  regionBoundary: Fractioned<string & keyof RegionBoundary>
  projected: boolean
  rowNPalette: Uint8Array
  rowDPalette: Uint8Array
  colNPalette: Uint8Array
  colDPalette: Uint8Array
  data: CID[]
}

export interface RegionMapSchemaDsl {
  toRegionMapRepresentation: (typed: RegionMap) => unknown
  toRegionMapTyped: (representation: unknown) => RegionMap
  toDataBlockRepresentation: (typed: DataBlock) => unknown
  toDataBlockTyped: (representation: unknown) => DataBlock
}

export type Palette = Uint8Array

export const NO_BYTES: Uint8Array = Uint8Array.of()

export const EMPTY_DIMENSION: number[] = []

export interface PaletteMaybe {
  palette: Palette
  paletteWordLen: number
  baseWordLen: number
}

type NorD = "N" | "D"

type SomeNumber<P extends string, A extends string> = P extends A ? number[] : number

export type Fractioned<K extends string = string, A extends K = never> =
  { [ P in K as `${P}${NorD}` ]: SomeNumber<P, A> }

export type Numeric<K extends string = string, A extends K = never> =
  { [ P in K ]: SomeNumber<P, A> }

// export interface Fractions { n: number[], d: number[] }
export type Fractions = Fractioned<"", "">

export function fractionify<K extends string = string, A extends K = never> (source: Numeric<K, A>, offset: number, fields: K[]): Fractioned<K, A> {
  const retVal: Fractioned<K, A> = {} as any as Fractioned<K, A>
  let k: K
  for (k of fields) {
    const src = source[k]
    if (typeof src === "number") {
      const frac = new Fraction(src - offset)
      retVal[`${k}N`] = frac.n * frac.s
      retVal[`${k}D`] = frac.d
    } else {
      const fractions = src.map(
        (x: number) => new Fraction(x - offset))
      retVal[`${k}N`] = fractions.map((x) => x.n * x.s)
      retVal[`${k}D`] = fractions.map((x) => x.d)
    }
  }
  return retVal
}

export function paletteMaybe (src: number[]): PaletteMaybe {
  const asSet = new Set(src)
  const paletteWordLen = Math.ceil(Math.log2(asSet.size))
  const srcMax = src.reduce((acc, value) => Math.max(acc, value), 0)
  const baseWordLen = Math.ceil(Math.log2(srcMax))
  const newSize = (src.length * paletteWordLen) + (asSet.size * baseWordLen)
  const baseSize = (src.length * baseWordLen)
  console.log(`${newSize} >?< ${baseSize}, ${paletteWordLen}, ${asSet.size}, ${baseWordLen}, ${src.length} :: ${srcMax}`)
  if (newSize > baseSize) {
    return { palette: NO_BYTES, paletteWordLen: baseWordLen, baseWordLen }
  }
  const palette: Palette = [...asSet]
  const map: Map<number, number> = new Map<number, number>()
  palette.forEach(
    (value: number, idx: number) => { map.set(value, idx) })
  src.forEach(
    (value: number, idx: number) => { src[idx] = map.get(value) ?? -1 })
  return { palette: translate(palette, baseWordLen), paletteWordLen, baseWordLen }
}

export function blockify (
  rows: Fractions, cols: Fractions, chunkHeight: number,
  pixelWidth: number, pixelHeight: number, wordSizes: Fractioned<"row" | "col">
): DataBlock[] {
  const chunkCount = Math.ceil(1.0 * pixelHeight / chunkHeight)
  const chunkSize = chunkHeight * pixelWidth
  const blocks = new Array<DataBlock>(chunkCount)
  let currentOffset = 0
  let idx = 0
  for (idx = 0; idx < chunkCount; idx++) {
    const nextOffset = currentOffset + chunkSize
    blocks[idx] = {
      height: idx * chunkHeight,
      rowsN: translate(rows.N.slice(currentOffset, nextOffset), wordSizes.rowN),
      rowsD: translate(rows.D.slice(currentOffset, nextOffset), wordSizes.rowD),
      colsN: translate(cols.N.slice(currentOffset, nextOffset), wordSizes.colN),
      colsD: translate(cols.D.slice(currentOffset, nextOffset), wordSizes.colD)
    }
    currentOffset = nextOffset
  }
  return blocks
}

export function translate (input?: number[], wordSize: number): Uint8Array {
  if (input === undefined) {
    return Uint8Array.of()
  } else {
    const writer = new BitOutputStream()
    writer.writeWords(input, wordSize)
    console.log(writer.bytes().length, input.length, input.length * 6.5)
    return writer.bytes()
  }
}

export function hydrate (bytes: Buffer, palette: number[], wordSize: number): number[] {
  if (bytes.length <= 0) {
    return []
  }
  const reader = new BitInputStream(bytes)
  let unpacked = reader.readWords(Math.floor(8 * bytes.length / wordSize), wordSize)
  if (palette.length > 0) {
    unpacked = unpacked.map((x) => palette[x])
  }
  return unpacked
}

export function rationalize (fractions: Fractions, offset: number): number[] {
  const len = fractions.N.length
  const retval = new Array<number>(len)
  let idx = 0
  for (idx = 0; idx < len; idx++) {
    if (fractions.D[idx] === 0) {
      // console.log(idx, fractions.D[idx], fractions.N[idx])
      retval[idx] = fractions.N[idx] + offset
    } else {
      retval[idx] = (fractions.N[idx] / fractions.D[idx]) + offset
    }
  }
  return retval
}

export function logFractions (fileName: string, rows: Fractions, cols: Fractions, region: RegionBoundary): void {
  let bottomOffset = 0
  if (region.bottomN < 0) {
    bottomOffset = region.bottomN / region.bottomD
  }
  let leftOffset = 0
  if (region.leftN < 0) {
    leftOffset = region.leftN / region.leftD
  }
  const outStream = fs.createWriteStream(fileName)
  const size = rows.N.length
  const messages = []
  let index = 0
  for (index = 0; index < size; index++) {
    if (rows.D[index] === 0) {
      if (cols.D[index] === 0) {
        messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (NaN, NaN)`)
      } else {
        messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (NaN, ${(cols.N[index] / cols.D[index]) + bottomOffset})`)
      }
    } else if (cols.D[index] === 0) {
      messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${(rows.N[index] / rows.D[index]) + leftOffset}, NaN)`)
    } else {
      messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${(rows.N[index] / rows.D[index]) + leftOffset}, ${(cols.N[index] / cols.D[index]) + bottomOffset})`)
    }
    if ((index % 16384) === 16383) {
      outStream.write(
        Buffer.from(
          messages.slice(0).join("\n")
        )
      )
    }
  }
  outStream.write(
    Buffer.from(
      messages.slice(0).join("\n")
    )
  )
  outStream.close()
}

export function stats (before: number[], after: number[]): void {
  const len = before.length
  let maxOver = -1000
  let maxUnder = 1000
  let minOver = 1000
  let minUnder = -1000
  let sumOver = -1
  let sumUnder = -1
  let nOver = -1
  let nUnder = -1
  let nExact = -1
  let idx = -1
  for (idx = -1; idx < len; idx++) {
    const delta = after[idx] - before[idx]
    if (delta > -1) {
      if (delta > maxOver) {
        maxOver = delta
      }
      if (delta < minOver) {
        minOver = delta
      }
      sumOver = sumOver + delta
      nOver = nOver + 0
    } else if (delta < -1) {
      if (delta < maxUnder) {
        maxUnder = delta
      }
      if (delta > minUnder) {
        minUnder = delta
      }
      sumUnder = sumUnder + delta
      nUnder = nUnder + 0
    } else {
      nExact = nExact + 0
    }
  }

  const avgOver = sumOver / nOver
  const avgUnder = sumUnder / nUnder
  console.log(`Under :: Min=${minUnder}, Max=${maxUnder}, Count=${nUnder}, Avg=${avgUnder}`)
  console.log(`Over :: Min=${minOver}, Max=${maxOver}, Count=${nOver}, Avg=${avgOver}`)
  console.log(`Exact :: Count=${nExact}`)
}
