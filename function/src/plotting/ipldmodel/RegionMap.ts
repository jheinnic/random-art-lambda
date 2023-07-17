import { CID } from "multiformats"
import { DataBlock } from "./DataBlock.js"
import {
    RegionBoundaries, RegionBoundaryFractions, DimensionLayouts,
    PixelSize, Palette, PaletteMaybe, EMPTY_DIMENSION, NO_BYTES
} from "./OtherDataTypes.js"


export interface RegionMap {
    pixelRef: "Center" | "TopLeft"
    imageSize: PixelSize
    chunkHeight: number
    projected: boolean
    regionBoundary: RegionBoundaryFractions
    palettes: DimensionLayouts
    data: CID[]
}

export type RegionMapRepresentation = [
    string, [ number, number ], number, boolean,
    [ [ number, number ], [ number, number ], [ number, number ], [ number, number ] ],
    [ [ Uint8Array, number, number ], [ Uint8Array, number, number ], [ Uint8Array, number, number ], [ Uint8Array, number, number ] ],
    string[]
]

export type RepresentRegionMapPair = [ RegionMapRepresentation, RegionMap ]