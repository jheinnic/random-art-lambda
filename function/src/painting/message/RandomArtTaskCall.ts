import { CID } from "multiformats"
import { Canvas } from "canvas"
import { v4 as uuidv4 } from "uuid"

import { RandomArtTaskReply } from "./RandomArtTaskReply.js"
import type { Prefix } from "./Prefix.js"
import type { Suffix } from "./Suffix.js"

export class RandomArtTaskCall {
   public readonly correlationId: string

   constructor(
      public readonly prefix: Prefix,
      public readonly suffix: Suffix,
      public readonly regionMap: CID,
   ) {
      this.correlationId = uuidv4()
   }

   public prepareReply(canvas: Canvas): RandomArtTaskReply {
      return new RandomArtTaskReply(this.correlationId, canvas)
   }
}
