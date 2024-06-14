import { CID } from "multiformats"
import { StringKeys } from "simplytyped"
import { RepresentUnionPair, UnionAsDomainModel, UnionAsRepresentation } from "../../ipld/interface/index.js"

export const NO_BYTES: Uint8Array = Uint8Array.of()

export const EMPTY_DIMENSION: readonly number[] = []

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

type NumeratorDenominator = "N" | "D"

type PrefixSuffixRecord<Prefix extends string, Suffix extends string, T> = {
  [ K in Prefix as `${ K }${ Suffix }` ]: T
}
type FractionRecord<Prefix extends string, T> = PrefixSuffixRecord<Prefix, NumeratorDenominator, T>
export type FractionList = Record<NumeratorDenominator, number[]>
export type FractionPalette = Record<NumeratorDenominator, readonly number[]>

export type RegionBoundaryFractions = FractionRecord<StringKeys<RegionBoundaries>, number>
export type RowColRecord<T> = FractionRecord<"rows" | "cols", T>
export type DimensionCodings = RowColRecord<DimensionCoding>