import { Canvas } from "canvas"

export class RandomArtTaskReply {
   constructor(
      public readonly correlationId: string,
      public readonly canvas?: Canvas,
      public readonly error?: string,
   ) {
      if (this.canvas !== undefined) {
         if (this.error !== undefined) {
            throw new Error("Cannot define both Canvas and error message")
         }
      } else {
         if (this.error === undefined) {
            throw new Error("Must defined either Canvas or error message")
         }
      }
   }
}
