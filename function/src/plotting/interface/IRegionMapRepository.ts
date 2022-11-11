import { CID } from "multiformats/cid"

import { IRegionMap } from "./IRegionMap.js"
import { IRegionMapBuilder } from "./IRegionMapBuilder.js"

export interface IRegionMapRepository {
  import: (director: (builder: IRegionMapBuilder) => void) => Promise<CID>
  load: (cid: CID) => Promise<IRegionMap>
}
