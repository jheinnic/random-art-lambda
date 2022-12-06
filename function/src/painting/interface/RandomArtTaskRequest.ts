import { CID } from "multiformats"

import { Prefix } from "./Prefix.js"
import { Suffix } from "./Suffix.js"

export class RandomArtTaskRequest {
  constructor (
    public readonly prefix: Prefix,
    public readonly suffix: Suffix,
    public readonly regionMap: CID,
  ) { }
}
