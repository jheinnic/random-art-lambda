import { CID } from "multiformats"
import { RegionBoundaryFractions, DimensionCodings, PixelSize } from "./OtherDataTypes.js"


export interface RegionMap {
    pixelRef: "Center" | "TopLeft"
    imageSize: PixelSize
    projected: boolean
    regionBoundary: RegionBoundaryFractions
    codings: DimensionCodings
    palettes: CID[]
    data: CID[]
}

export type RegionMapRepresentation = [
    string, [ number, number ], boolean,
    [ number, number, number, number, number, number, number, number ],
    [ [ number, number ], [ number, number ], [ number, number ], [ number, number ] ],
    string[],
    string[]
]

export type RepresentRegionMapPair = [ RegionMapRepresentation, RegionMap ]