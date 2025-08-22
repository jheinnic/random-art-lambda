import { CID } from "multiformats"

export class EnrollSourceFileReply {
   constructor(
      public readonly correlationId: string,
      public readonly cid?: CID,
      public readonly error?: string,
   ) {
      if (this.cid !== undefined) {
         if (this.error !== undefined) {
            throw new Error("Cannot define both CID and error message")
         }
      } else {
         if (this.error === undefined) {
            throw new Error("Must defined either CID or error message")
         }
      }
   }

   isError(): boolean {
      return this.cid === undefined && this.error !== undefined
   }
}
