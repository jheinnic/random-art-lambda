import { Canvas } from "canvas"
import { openSync, WriteStream, writeSync } from "fs"

export class CanvasWriter {
  public constructor (
    private readonly canvas: Canvas,
    private readonly streamOut: WriteStream,
    private readonly emitter: EventEmitter
  ) {
    this.emitter.on("painted", () => {
      this.streamOutput()
    })
    streamOut.on("end", () => {
      console.log(`Wrote out png of {streamOut.bytesWritten} bytes`)
    })
  }

  private streamOutput (): void {
    const streamIn = this.canvas.createPNGStream()

    streamIn.on("error", (err: any) => {
      console.error(err)
      streamOut.close()
    })
    streamIn.on("end", streamOut.close)
    streamIn.pipe(streamOut)
  }

  public writeSync (outputPath: string): void {
    const fd = openSync(outputPath, "w")

    this.canvas.streamPNGSync((err: any, buf: readonly Buffer) => {
      if (err !== undefined) {
        console.error("PNG Stream callback received an error!")
        console.error(err)
        throw err
      }
      writeSync(fd, buf)
    })
  }
}
