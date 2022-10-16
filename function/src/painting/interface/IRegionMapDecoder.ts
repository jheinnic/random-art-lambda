import { IRegionMap } from "./IRegionMap.js"

export interface IRegionMapDecoder {
  provide: (modelData: Uint8Array) => Promise<IRegionMap>
}
