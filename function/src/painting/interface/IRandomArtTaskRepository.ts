import { CID } from "multiformats"

import { RandomArtTask } from "../../painting/components/RandomArtTask.js"
import { IRandomArtTaskBuilder } from "./IRandomArtTaskBuilder.js"

export interface IRandomArtTaskRepository {
  create: (director: (builder: IRandomArtTaskBuilder) => void) => Promise<CID>
  save: (source: RandomArtTask) => Promise<CID>
  load: (cid: CID) => Promise<RandomArtTask>
}
