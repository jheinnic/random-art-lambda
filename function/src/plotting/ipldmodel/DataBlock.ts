import { ISerdes } from "../../ipld/interface/ISerdes.js"

export interface DataBlock {
    height: number
    rowsN: Uint8Array
    rowsD: Uint8Array
    colsN: Uint8Array
    colsD: Uint8Array
}

export type DataBlockRepresentation = [ number, Uint8Array, Uint8Array, Uint8Array, Uint8Array ]

export type RepresentDataBlockPair = [ DataBlockRepresentation, DataBlock ]

export type IDataBlockSerdes = ISerdes<RepresentDataBlockPair>
