import { Canvas } from "canvas"
import * as fs from "fs"

// import { ICompleteObserver } from "../interface/index.js"

export class CanvasPersister { // implements ICompleteObserver {
  public constructor (
    private readonly canvas: Canvas,
    private readonly streamOut: fs.WriteStream,
  ) {
    this.streamOut.on("end", () => {
      console.log(`Wrote out png with ${this.streamOut.bytesWritten} bytes`)
    })
    this.streamOut.on("error", (err: any) => {
      console.error(`Error received after writing ${this.streamOut.bytesWritten} bytes`)
      console.error(err)
    })
  }

  public finish (): void {
    // const streamIn = this.canvas.createPNGStream()
    // const streamOut = this.streamOut
    // streamIn.on("error", (err: any) => {
    // console.error(err)
    // streamOut.close()
    // })
    this.canvas.createPNGStream().pipe(this.streamOut)
  }
}
