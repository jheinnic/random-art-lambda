import { CID } from "multiformats/cid"

import { AbstractRegionMap } from "../../painting/components/AbstractRegionMap.js"
import { IRegionMapBuilder } from "./IRegionMapBuilder.js"

export interface IRegionMapRepository {
  import: (director: (builder: IRegionMapBuilder) => void, paletteThreshold?: number) => Promise<CID>
  load: (cid: CID) => Promise<AbstractRegionMap>
}
