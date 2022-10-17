import { CID } from "multiformats/cid"
import { Optional } from "simplytyped"

import { AbstractRegionMap } from "../../painting/components/AbstractRegionMap.js"
import { IRegionMapBuilder } from "./IRegionMapBuilder.js"
import { DataBlock, RegionMap } from "./RegionMapSchemaTypes.js"

export interface IRegionMapRepository {
  /// saveRootModel: (source: Optional<RegionMap, "data">, data: DataBlock[]) => Promise<CID>
  import: (director: (builder: IRegionMapBuilder) => void, paletteThreshold?: number) => Promise<CID>
  load: (cid: CID) => Promise<AbstractRegionMap>
}
