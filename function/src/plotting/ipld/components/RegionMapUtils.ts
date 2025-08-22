import { BitInputStream, BitOutputStream } from "@thi.ng/bitstream"
import Fraction from "fraction.js"
import * as fs from "fs"

import {
   DataBlock,
   FractionList,
   FractionPalette,
   NO_BYTES,
   RowColRecord,
   RegionBoundaries,
   RegionBoundaryFractions,
   DimensionCoding,
   EMPTY_DIMENSION,
} from "../ipldmodel/index.js"

export function fractionifyBounds(
   bounds: RegionBoundaries,
): RegionBoundaryFractions {
   const top: Fraction = new Fraction(bounds.top)
   const bottom: Fraction = new Fraction(bounds.bottom)
   const left: Fraction = new Fraction(bounds.left)
   const right: Fraction = new Fraction(bounds.right)
   return {
      topN: top.n * top.s,
      topD: top.d,
      bottomN: bottom.n * bottom.s,
      bottomD: bottom.d,
      leftN: left.n * left.s,
      leftD: left.d,
      rightN: right.n * right.s,
      rightD: right.d,
   }
}

export function fractionifyList(
   source: readonly number[],
   offset: number,
): FractionList {
   const fractions = source.map((x: number) => new Fraction(x - offset))
   return {
      N: fractions.map((f: Fraction) => f.n * f.s),
      D: fractions.map((f: Fraction) => f.d),
   }
}

/*
export function fractionify<K extends string = never, A extends string = never>( source: Record<K, number> & Record<A, number[]>, offset: number, kFields: K[], aFields: A[] = [] ): Fractioned<K, A>{
  const retVal: Partial<Fractioned<K, A>> = {} // as any as Fractioned<K, A>
  let k: K
  for (k of kFields) {
    const src: number = source[k] as number
    const frac = new Fraction(src - offset)
    retVal[`${k}N`] = (frac.n * frac.s) as Fractioned<K, A>[`${K}N`]
    retVal[`${k}D`] = frac.d as Fractioned<K, A>[`${K}D`]
    console.log(k)
    console.dir(source[k], { depth: Infinity })
    console.dir(retVal[`${k}N`], { depth: Infinity })
    console.dir(retVal[`${k}D`], { depth: Infinity })
  }
  let a: A
  for (a of aFields) {
    const src: number[] = source[a] as number[]
    const fractions = src.map(
      (x: number) => new Fraction(x - offset))
      retVal[`${a}N`] = fractions.map((x: Fraction) => x.n * x.s) as Fractioned<K, A>[`${A}N`]
      retVal[`${a}D`] = fractions.map((x: Fraction) => x.d) as Fractioned<K, A>[`${A}D`]
    console.log(a)
    console.dir(source[a], { depth: Infinity })
    console.dir(retVal[`${a}N`], { depth: Infinity })
    console.dir(retVal[`${a}D`], { depth: Infinity })
  }
  return retVal as Fractioned<K, A>
}
*/

export type Palette = readonly number[]

export interface PaletteMaybe {
   palette: Palette
   paletteWordLen: number
   baseWordLen: number
}

export function paletteMaybe(src: number[]): PaletteMaybe {
   const asSet = new Set<number>(src)
   let srcMax = -1
   asSet.forEach((value: number) => {
      srcMax = Math.max(srcMax, Math.abs(value))
   })
   const paletteWordLen = Math.max(Math.ceil(Math.log2(asSet.size)), 1)
   const baseWordLen = Math.ceil(Math.log2(srcMax))
   const newSize = src.length * paletteWordLen + asSet.size * baseWordLen
   const baseSize = src.length * baseWordLen
   console.log(
      `${newSize} >?< ${baseSize}, ${paletteWordLen}, ${asSet.size}, ${baseWordLen}, ${src.length} :: ${srcMax}`,
   )
   if (newSize > baseSize) {
      return { palette: EMPTY_DIMENSION, paletteWordLen: 0, baseWordLen }
      // return { palette: NO_BYTES, paletteWordLen: 0, baseWordLen }
   }
   const palette: readonly number[] = [...asSet]
   const map: Record<number, number> = {}
   palette.forEach((value: number, idx: number) => {
      map[value] = idx
   })
   src.forEach((value: number, idx: number) => {
      src[idx] = map[value]
   })
   // return { palette: translate( palette, baseWordLen ), paletteWordLen, baseWordLen }
   return { palette, paletteWordLen: baseWordLen, baseWordLen: paletteWordLen }
}

export type WordSizes = RowColRecord<number>
const BLOCK_OVERHEAD = 16
const NO_DATA_BLOCKS: readonly DataBlock[] = []

function measureSize(
   name: string,
   numbers: readonly number[],
   wordSize: number,
): number {
   if (numbers.length > 0) {
      if (wordSize <= 0) {
         throw new Error(
            `Word size for ${name} must be positive since its array has data`,
         )
      }
   } else if (wordSize !== 0) {
      throw new Error(
         `Word size for ${name} must be 0 since its array is empty`,
      )
   }

   return wordSize * numbers.length
}

export function blockify(
   rows: FractionPalette,
   cols: FractionPalette,
   chunkSize: number,
   wordSizes: WordSizes,
): readonly DataBlock[] {
   const rowsNSize = measureSize("rowsN", rows.N, wordSizes.rowsN)
   const rowsDSize = measureSize("rowsD", rows.D, wordSizes.rowsD)
   const colsNSize = measureSize("colsN", cols.N, wordSizes.colsN)
   const colsDSize = measureSize("colsD", cols.D, wordSizes.colsD)
   const totalSize = rowsNSize + rowsDSize + colsNSize + colsDSize

   if (totalSize === 0) {
      return NO_DATA_BLOCKS
   }

   // const chunkCount = Math.ceil( 1.0 * pixelHeight / chunkHeight )
   const minBlockCount = Math.ceil(
      1.0 * (totalSize / (chunkSize - BLOCK_OVERHEAD)),
   )
   const blockCount = minBlockCount > 1 ? minBlockCount + 1 : minBlockCount
   const blocks = new Array<DataBlock>(blockCount)

   const rowsNChunk = Math.max(
      Math.round((1.0 * rows.N.length) / minBlockCount),
      Math.ceil((1.0 * rows.N.length) / blockCount),
   )
   const rowsDChunk = Math.max(
      Math.round((1.0 * rows.D.length) / minBlockCount),
      Math.ceil((1.0 * rows.D.length) / blockCount),
   )
   const colsNChunk = Math.max(
      Math.round((1.0 * cols.N.length) / minBlockCount),
      Math.ceil((1.0 * cols.N.length) / blockCount),
   )
   const colsDChunk = Math.max(
      Math.round((1.0 * cols.D.length) / minBlockCount),
      Math.ceil((1.0 * cols.D.length) / blockCount),
   )

   let idx = 0
   let rowsNIdx = 0
   let rowsDIdx = 0
   let colsNIdx = 0
   let colsDIdx = 0
   for (idx = 0; idx < blockCount; idx++) {
      const nextRowsNIdx = rowsNIdx + rowsNChunk
      const nextRowsDIdx = rowsDIdx + rowsDChunk
      const nextColsNIdx = colsNIdx + colsNChunk
      const nextColsDIdx = colsDIdx + colsDChunk
      blocks[idx] = {
         // height: idx * chunkHeight,
         rowsN: translate(
            rows.N.slice(rowsNIdx, nextRowsNIdx),
            wordSizes.rowsN,
         ),
         rowsD: translate(
            rows.D.slice(rowsDIdx, nextRowsDIdx),
            wordSizes.rowsD,
         ),
         colsN: translate(
            cols.N.slice(colsNIdx, nextColsNIdx),
            wordSizes.colsN,
         ),
         colsD: translate(
            cols.D.slice(colsDIdx, nextColsNIdx),
            wordSizes.colsD,
         ),
      }
      rowsNIdx = nextRowsNIdx
      rowsDIdx = nextRowsDIdx
      colsNIdx = nextColsNIdx
      colsDIdx = nextColsDIdx
   }
   return blocks as readonly DataBlock[]
}

export function unblockify(
   dataBlocks: readonly DataBlock[],
   paletteBlocks: readonly DataBlock[],
   selector: (x: Readonly<DataBlock>) => Uint8Array,
   coding: DimensionCoding,
): Palette {
   const dataBytes: Buffer = Buffer.concat(dataBlocks.map(selector))
   const paletteBytes: Buffer = Buffer.concat(paletteBlocks.map(selector))
   let paletteArray: Palette = EMPTY_DIMENSION
   if (coding.paletteWordLen > 0) {
      paletteArray = hydrate(
         paletteBytes,
         EMPTY_DIMENSION,
         coding.paletteWordLen,
      )
   }
   return hydrate(dataBytes, paletteArray, coding.baseWordLen)
}

export function translate(input: number[], wordSize: number): Uint8Array {
   if (
      input === undefined ||
      input === null ||
      input.length === 0 ||
      wordSize === 0
   ) {
      return NO_BYTES
   } else {
      const writer = new BitOutputStream()
      console.warn(writer.writeWords(input, wordSize))
      console.log(
         "8 * ",
         writer.bytes().length,
         " = ",
         8 * writer.bytes().length,
         " ==> ",
         input.length,
         " * ",
         wordSize,
         " = ",
         input.length * wordSize,
      ) // ' :: ', input.length * 6.5)
      return writer.bytes()
   }
}

export function hydrate(
   bytes: Uint8Array,
   palette: Palette,
   wordSize: number,
): Palette {
   if (bytes.length === 0 || wordSize === 0) {
      return EMPTY_DIMENSION
   }
   const reader = new BitInputStream(bytes)
   let unpacked = reader.readWords(
      Math.floor((8 * bytes.length) / wordSize),
      wordSize,
   )
   if (palette.length > 0) {
      unpacked = unpacked.map((x: number) => palette[x])
   }
   return unpacked
}

export function rationalize(
   fractions: FractionPalette,
   offset: number,
): Palette {
   const len = fractions.N.length
   const retval = new Array<number>(len)
   let idx = 0
   for (idx = 0; idx < len; idx++) {
      if (fractions.D[idx] === 0 || fractions.D[idx] === 1) {
         // console.log(idx, fractions.D[idx], fractions.N[idx])
         retval[idx] = fractions.N[idx] + offset
      } else {
         retval[idx] = fractions.N[idx] / fractions.D[idx] + offset
      }
   }
   return retval
}

export function logFractions(
   fileName: string,
   rows: FractionPalette,
   cols: FractionPalette,
   region: RegionBoundaryFractions,
): void {
   let bottomOffset = 0
   if (region.bottomN < 0) {
      bottomOffset = region.bottomN / region.bottomD
   }
   let leftOffset = 0
   if (region.leftN < 0) {
      leftOffset = region.leftN / region.leftD
   }
   const outStream = fs.createWriteStream(fileName)
   const size: number = rows.N.length
   const messages: string[] = []
   let index = 0
   for (index = 0; index < size; index++) {
      if (rows.D[index] === 0) {
         if (cols.D[index] === 0) {
            messages.push(
               `${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (NaN, NaN)`,
            )
         } else {
            messages.push(
               `${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (NaN, ${cols.N[index] / cols.D[index] + bottomOffset})`,
            )
         }
      } else if (cols.D[index] === 0) {
         messages.push(
            `${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${rows.N[index] / rows.D[index] + leftOffset}, NaN)`,
         )
      } else {
         messages.push(
            `${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${rows.N[index] / rows.D[index] + leftOffset}, ${cols.N[index] / cols.D[index] + bottomOffset})`,
         )
      }
      if (index % 16384 === 16383) {
         outStream.write(Buffer.from(messages.splice(0).join("\n")))
      }
   }
   outStream.write(Buffer.from(messages.splice(0).join("\n")))
   outStream.close()
}

export function stats(
   before: readonly number[],
   after: readonly number[],
): void {
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
      if (delta > 0) {
         if (delta > maxOver) {
            maxOver = delta
         }
         if (delta < minOver) {
            minOver = delta
         }
         sumOver = sumOver + delta
         nOver = nOver + 1
      } else if (delta < 0) {
         if (delta < maxUnder) {
            maxUnder = delta
         }
         if (delta > minUnder) {
            minUnder = delta
         }
         sumUnder = sumUnder + delta
         nUnder = nUnder + 1
      } else {
         nExact = nExact + 1
      }
   }

   const avgOver = sumOver / nOver
   const avgUnder = sumUnder / nUnder
   console.log(
      `Under :: Min=${minUnder}, Max=${maxUnder}, Count=${nUnder}, Avg=${avgUnder}`,
   )
   console.log(
      `Over :: Min=${minOver}, Max=${maxOver}, Count=${nOver}, Avg=${avgOver}`,
   )
   console.log(`Exact :: Count=${nExact}`)
   const bias = sumUnder + sumOver
   console.log(`Bias :: Value=${bias}`)
}
