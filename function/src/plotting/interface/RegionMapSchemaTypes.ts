import { CID } from "multiformats"

export interface PixelSize {
  pixelWidth: number
  pixelHeight: number
}

type NorD = "N" | "D"

export type StrKeyOf<T> = keyof T & string

type SomeNumbers<P extends string, A extends string> = P extends A ? number[] : number

export type Fractioned<K extends string = string, A extends K = never> =
  { [ P in K as `${P}N` | `${P}D` ]: SomeNumbers<P, A> }
  // { [ P in K as `${P}${NorD}` ]: P extends A ? number[] : number }

export type Numeric<K extends string = string, A extends K = never> =
  { [ P in K ]: P extends A ? number[] : number }

// export type Fractioned<K extends string = string, A extends K = never> = Numeric<`${K}${NorD}`, `${A}${NorD}`>

export interface RegionBoundaries {
  top: number
  bottom: number
  left: number
  right: number
}

export type RegionBoundaryFractions = Fractioned<StrKeyOf<RegionBoundaries>>

export const NO_BYTES: Uint8Array = Uint8Array.of()

export const EMPTY_DIMENSION: number[] = []

export type Palette = Uint8Array

export interface PaletteMaybe {
  palette: Palette
  paletteWordLen: number
  baseWordLen: number
}

export interface DataBlock {
  height: number
  rowsN: Uint8Array
  rowsD: Uint8Array
  colsN: Uint8Array
  colsD: Uint8Array
}

export interface RegionMap {
  pixelRef: "Center" | "TopLeft"
  imageSize: PixelSize
  chunkHeight: number
  regionBoundary: RegionBoundaryFractions
  projected: boolean
  rowsN: PaletteMaybe
  rowsD: PaletteMaybe
  colsN: PaletteMaybe
  colsD: PaletteMaybe
  data: CID[]
}

export type Fractions = Fractioned<"", "">
