import { createWriteStream } from "fs"

import { FileTransport } from "./common/components/FileTransport"
import { CanvasWriter } from "./painting/components/CanvasWriter"
import * as genjs6 from "./painting/components/genjs6"
import { RandomArtPainter } from "./painting/components/RandomArtPainter"
import { PBufPlotModelProvider } from "./plotting/protobuf/PBufPlotModelProvider"

async function run (): Promise<void> {
  const plotterOne = await new PBufPlotModelProvider(
    new FileTransport()
  ).provide("./fdoc.proto")
  const plotterTwo = await new PBufPlotModelProvider(
    new FileTransport()
  ).provide("./gdoc.proto")

  // Uint8Array.from(Buffer.from(string));
  const suffix = [109, 116, 103, 64, 72, 112, 115, 108, 109, 101, 66, 126, 62]
  const prefix = [
    107, 98, 102, 119, 97, 32, 32, 101, 109, 97, 118, 109, 118, 98, 122
  ]
  const aFilename = `testrun/test_003`

  const painterOne = new RandomArtPainter(
    genjs6.newPicture(prefix, suffix),
    plotterOne
  )
  new CanvasWriter(painterOne.paint()).writeCallbacks(
    createWriteStream(`testrun03/writerOne/${aFilename}.png`)
  )

  const painterTwo = new RandomArtPainter(
    genjs6.newPicture(prefix, suffix),
    plotterTwo
  )
  new CanvasWriter(painterTwo.paint()).writeCallbacks(
    createWriteStream(`testrun03/writerTwo/${aFilename}.png`)
  )
}

run().catch((err) => {
  console.log(err)
})
