import { Canvas } from "canvas"
import { PassThrough } from "node:stream"
import { pipeline } from "node:stream/promises"
import * as fs from "fs"

export class CanvasPersister {
   public constructor(
      private readonly canvas: Canvas,
      private readonly streamOut: fs.WriteStream,
   ) {}

   private closeStream(): void {
      this.streamOut.close()
   }

   public async finish(): Promise<number> {
      const pngStream = this.canvas.createPNGStream()
      // This is our "Spy"
      let bytesProcessed: number = 0
      const progressSpy = new PassThrough()
      progressSpy.on("data", (chunk: Buffer) => {
         bytesProcessed += chunk.length
         process.stdout.write(`\rBytes through pipe: ${bytesProcessed}`)
      })
      try {
         await pipeline(pngStream, progressSpy, this.streamOut)
      } catch (err) {
         console.error("Error in finish:", err)
         throw err
      }
      return bytesProcessed
   }
}
