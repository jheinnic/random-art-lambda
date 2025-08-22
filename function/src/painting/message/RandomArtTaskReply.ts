import { Canvas } from "canvas"

export class RandomArtTaskReply {
   constructor(
      public readonly correlationId: string,
      public readonly readable: Canvas,
   ) {}
}
