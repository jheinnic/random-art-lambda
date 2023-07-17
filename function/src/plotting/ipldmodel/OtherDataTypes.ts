import { CID } from "multiformats"
import { StringKeys } from "simplytyped"
import { RepresentUnionPair, UnionAsDomainModel, UnionAsRepresentation } from "../../ipld/interface/index.js"

export const NO_BYTES: Uint8Array = Uint8Array.of()

export const EMPTY_DIMENSION: number[] = []

export type Palette = Uint8Array

export interface PaletteMaybe {
  palette: Palette
  paletteWordLen: number
  baseWordLen: number
}

export interface PixelSize {
  pixelWidth: number
  pixelHeight: number
}

export interface RegionBoundaries {
  top: number
  bottom: number
  left: number
  right: number
}

type Fractions<K extends string> = {
  [ P in K as `${ P }N` | `${ P }D` ]: number
}

export type RegionBoundaryFractions = Fractions<StringKeys<RegionBoundaries>>

export type WordSizes = Fractions<"rows" | "cols">

export interface DimensionLayouts {
  rowsN: PaletteMaybe
  rowsD: PaletteMaybe
  colsN: PaletteMaybe
  colsD: PaletteMaybe
}

export interface FractionList {
  N: number[]
  D: number[]
}





/*
export type Fractioned<K extends string = never, A extends string = never> =
  K extends never ? (
    A extends never ? never : FractionLists<A>
  ) : (
    A extends never ? Fractions<K> : ( Fractions<K> & FractionLists<A> )
  )
  */