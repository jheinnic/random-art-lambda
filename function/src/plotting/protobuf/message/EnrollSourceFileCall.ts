import { v4 as uuidV4 } from "uuid"
import { CID } from "multiformats"

import { EnrollSourceFileReply } from "./EnrollSourceFileReply.js"

export class EnrollSourceFileCall {
   public readonly correlationId: string = uuidV4()

   constructor(public readonly filePath: string) {}

   prepareReply(cid: CID): EnrollSourceFileReply {
      return new EnrollSourceFileReply(this.correlationId, cid, undefined)
   }

   prepareError(error: string): EnrollSourceFileReply {
      return new EnrollSourceFileReply(this.correlationId, undefined, error)
   }
}
