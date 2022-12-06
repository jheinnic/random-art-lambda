import { CID } from "multiformats"

import { Prefix } from "./Prefix.js"
import { Suffix } from "./Suffix.js"

export interface RandomArtworkSpec {
  readonly prefix: Prefix
  readonly suffix: Suffix
  readonly regionMap: CID
  readonly engineVersion: string
}
