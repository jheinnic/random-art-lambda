import { DataBlock, RegionMap } from "./RegionMapSchemaTypes.js"

export interface IRegionMapSchemaDsl {
  toRegionMapRepresentation: (typed: RegionMap) => unknown
  toRegionMapTyped: (representation: unknown) => RegionMap
  toDataBlockRepresentation: (typed: DataBlock) => unknown
  toDataBlockTyped: (representation: unknown) => DataBlock
}
