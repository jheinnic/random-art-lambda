import { CID } from "multiformats"
import { Readable } from "stream"

import { Prefix, Suffix } from "../interface/index.js"

export interface IRandomArtwork {
  readonly cid: CID,
  readonly prefix: Prefix,
  readonly suffix: Suffix,
  readonly regionMap: CID,
  readonly engineVersion: string,
  readonly buffer: Buffer,
  readonly stream: Readable
}
