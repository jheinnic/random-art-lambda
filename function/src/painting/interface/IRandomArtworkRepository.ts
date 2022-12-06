import { CID } from "multiformats"

import { IRandomArtwork } from "./IRandomArtwork.js"
import { RandomArtTaskRequest } from "./RandomArtTaskRequest.js"

export interface IRandomArtworkRepository {
  // create: (director: (builder: IRandomArtTaskBuilder) => void) => Promise<CID>
  save: (source: IRandomArtwork) => Promise<CID>
  load: (cid: CID) => Promise<IRandomArtwork>
}
