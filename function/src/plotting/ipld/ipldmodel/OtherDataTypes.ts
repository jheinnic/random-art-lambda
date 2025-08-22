import { StringKeys } from "simplytyped"

export const NO_BYTES: Uint8Array = Uint8Array.of()

export const EMPTY_DIMENSION: readonly number[] = []

export type RefPoint = "Center" | "TopLeft"

export interface DimensionCoding {
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
   [K in Prefix as `${K}${Suffix}`]: T
}
type FractionRecord<Prefix extends string, T> = PrefixSuffixRecord<
   Prefix,
   NumeratorDenominator,
   T
>
export type FractionList = Record<NumeratorDenominator, number[]>
export type FractionPalette = Record<NumeratorDenominator, readonly number[]>

export type RegionBoundaryFractions = FractionRecord<
   StringKeys<RegionBoundaries>,
   number
>
export type RowColRecord<T> = FractionRecord<"rows" | "cols", T>
export type DimensionCodings = RowColRecord<DimensionCoding>
