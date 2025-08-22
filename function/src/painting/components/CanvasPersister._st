import { Canvas } from "canvas"
import * as fs from "fs"

// import { ICompleteObserver } from "../interface/index.js"

export class CanvasPersister { // implements ICompleteObserver {
  public constructor (
    private readonly canvas: Canvas,
    private readonly streamOut: fs.WriteStream,
  ) {
    // this.streamOut.on( "end", () => {
    //   console.log( `Wrote out png with ${ this.streamOut.bytesWritten } bytes` )
    //   this.streamOut.close()
    // } )
    // this.streamOut.on( "finish", () => {
    //   console.log( `Wrote out png with ${ this.streamOut.bytesWritten } bytes` )
    //   this.streamOut.close()
    // } )
    // this.streamOut.on( "error", ( err: any ) => {
    //   console.error( `Error received after writing ${ this.streamOut.bytesWritten } bytes` )
    //   console.error( err )
    // } )
  }

  private closeStream() {
    this.streamOut.close()
  }

  public async finish(): Promise<void> {
    return new Promise<void>( ( resolve, reject ) => {
      try {
        const pngStream = this.canvas.createPNGStream()

        pngStream.on( "error", ( err ) => {
          console.error( "PNG stream error:", err )
          this.closeStream()
          reject( err ) // Reject the promise on error
        } )

        this.streamOut.on( "error", ( err ) => {
          console.error( "Write stream error:", err )
          this.closeStream()
          reject( err ) // Reject the promise on error
        } )

        this.streamOut.on( "finish", () => { // Use 'finish' for reliability
          console.log( "Write stream finished" )
          this.closeStream()
          resolve() // Resolve the promise when done
        } )

        pngStream.pipe( this.streamOut )
      } catch ( err ) {
        console.error( "Error in finish:", err )
        this.closeStream()
        reject( err ) // Reject the promise on error
      }
    } )
  }
}
