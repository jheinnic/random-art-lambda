import { CID } from "multiformats"
import { Canvas } from "canvas"
import { v4 as uuidv4 } from "uuid"

import { RandomArtTaskReply } from "./RandomArtTaskReply.js"
import type { Prefix } from "./Prefix.js"
import type { Suffix } from "./Suffix.js"

export abstract class AbstractRandomArtTaskCall {
   public abstract readonly inputKind: string

   public readonly correlationId: string

   constructor(public readonly regionMap: CID) {
      this.correlationId = uuidv4()
   }

   public prepareReply(canvas: Canvas): RandomArtTaskReply {
      return new RandomArtTaskReply(this.correlationId, canvas)
   }

   public prepareError(message: string): RandomArtTaskReply {
      return new RandomArtTaskReply(this.correlationId, undefined, message)
   }
}

export class RandomArtTaskCall extends AbstractRandomArtTaskCall {
   public readonly inputKind: "PrefixSuffix" = "PrefixSuffix"
   constructor(
      public readonly prefix: Prefix,
      public readonly suffix: Suffix,
      readonly regionMap: CID,
   ) {
      super(regionMap)
   }
}

export class RandomArtTaskWordsCall extends AbstractRandomArtTaskCall {
   public readonly inputKind: "WordPair" = "WordPair"
   constructor(
      public readonly prefix: string,
      public readonly suffix: string,
      readonly regionMap: CID,
   ) {
      super(regionMap)
   }
}
