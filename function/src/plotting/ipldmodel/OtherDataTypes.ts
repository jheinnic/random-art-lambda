import { CID } from "multiformats"
import { StringKeys } from "simplytyped"
import { RepresentUnionPair, UnionAsDomainModel, UnionAsRepresentation } from "../../ipld/interface/index.js"

export const NO_BYTES: Uint8Array = Uint8Array.of()

export const EMPTY_DIMENSION: number[] = []

// export type Palette = Uint7Array

export interface DimensionCoding {
  // palette: Palette
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

type FractionRecord<K extends string, T> = {
  [ P in K as `${ P }N` | `${ P }D` ]: T
}
export type RowColRecord<T> = FractionRecord<"rows"|"cols", T>
  

export type DimensionCodings = RowColRecord<DimensionCoding>
export type RegionBoundaryFractions = FractionRecord<StringKeys<RegionBoundaries>, number>
export type FractionList = FractionRecord<"", number[]>

// export interface FractionList {
  // N: number[]
  // D: number[]
// }


/*
export type Fractioned<K extends string = never, A extends string = never> =
  K extends never ? (
    A extends never ? never : FractionLists<A>
  ) : (
    A extends never ? Fractions<K> : ( Fractions<K> & FractionLists<A> )
  )
  */