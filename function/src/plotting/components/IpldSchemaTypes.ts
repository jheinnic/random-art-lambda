
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

type NorD = "N" | "D"

type SomeNumber<P extends string, A extends string> = P extends A ? number[] : number

export type Fractioned<K extends string = string, A extends K = never> =
  { [ P in K as `${P}${NorD}` ]: SomeNumber<P, A> }

export type Numeric<K extends string = string, A extends K = never> =
  { [ P in K ]: SomeNumber<P, A> }

// export interface Fractions { n: number[], d: number[] }
export type Fractions = Fractioned<"", "">

// interface Fns2 { N: number[], D: number[] }
// const a: Fns = { N: [1, 2, 3], D: [4, 5, 7] }
// const b: Fns2 = a
// const c: Fns = b
