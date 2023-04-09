import { CID } from "multiformats"
import { CombineObjects, StringKeys } from "simplytyped"

// import { Fractions } from "../../common/interfaces/index.js"

export interface PixelSize {
  pixelWidth: number
  pixelHeight: number
}

// type NorD = "N" | "D"

export interface RegionBoundaries {
  top: number
  bottom: number
  left: number
  right: number
}

type Fractions<K extends string> = {
    [P in K as `${P}N` | `${P}D`]: number
}

export type RegionBoundaryFractions = Fractions<StringKeys<RegionBoundaries>>

export type WordSizes = Fractions<"top" | "bottom">

export interface FractionList {
  N: number[]
  D: number[]
}

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

export interface ModelEnvelope {
  version: string
  model: any
}

/*
export type Fractioned<K extends string = never, A extends string = never> =
  K extends never ? (
    A extends never ? never : FractionLists<A>
  ) : (
    A extends never ? Fractions<K> : ( Fractions<K> & FractionLists<A> )
  )
  */