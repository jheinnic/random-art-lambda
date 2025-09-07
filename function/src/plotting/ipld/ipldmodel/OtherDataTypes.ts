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

type Boundary = "top" | "bottom" | "left" | "right"

type NumeratorDenominator = "N" | "D"

type BoundaryFraction = `${Boundary}${NumeratorDenominator}`

type RowColFraction =
   | `rows${NumeratorDenominator}`
   | `cols${NumeratorDenominator}`

export type RegionBoundaries = Record<Boundary, number>

export type RegionBoundaryFractions = Record<BoundaryFraction, number>

export type FractionList = Record<NumeratorDenominator, readonly number[]>

export type DimensionCodings = Record<RowColFraction, DimensionCoding>

export type WordSizes = Record<RowColFraction, number>
