/* eslint-disable @typescript-eslint/no-unused-vars */
import * as fs from "fs"

import { PointPlotData, PointPlotDocument } from "../plotting/protobuf/plot_mapping_pb.mjs"
import { Bench02Model } from "./Bench02Model.js"

const count = 0
function methodOne (model: unknown, x: number, y: number): void {
}
function methodTwo (model: unknown, x: number, y: number): void {
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (_: any): void => {}

function useZipMore (model: Bench02Model): void {
  for (const [region, pixel] of model.iter3()) {
    methodOne(model, region[0], region[1])
    methodTwo(model, pixel[0], pixel[1])
  }
}

function useZipSome (model: Bench02Model): void {
  for (const [region, pixel] of model) {
    methodOne(model, region[0], region[1])
    methodTwo(model, pixel[0], pixel[1])
  }
}

function useZipLess (model: Bench02Model): void {
  for (const [region, pixel] of model.iter2()) {
    methodOne(model, region[0], region[1])
    methodTwo(model, pixel[0], pixel[1])
  }
}

function usePrecomp (model: Bench02Model): void {
  for (const [region, pixel] of model.storedMap) {
    methodOne(model, region[0], region[1])
    methodTwo(model, pixel[0], pixel[1])
  }
}

function useBuilder (model: Bench02Model): void {
  model.directOne({
    plot: (xRegion: number, yRegion: number, xPixel: number, yPixel: number) => {
      methodOne(model, xRegion, yRegion)
      methodTwo(model, xPixel, yPixel)
    },
    finish: (): void => { }
  })
}

// console.dir(quip, { depth: Infinity })
const buf = fs.readFileSync("fdoc.proto")
const plotDocument = PointPlotDocument.deserializeBinary(buf)
const plotData = plotDocument.getData()
const model = new Bench02Model(plotData)
const loops = parseInt(process.argv[3])
switch (process.argv[2]) {
  case "noop": {
    for (let ii = 0; ii < loops; ii++) {
      noop(model)
    }
    break
  }
  case "zipmore": {
    for (let ii = 0; ii < loops; ii++) {
      useZipMore(model)
    }
    break
  }
  case "zipsome": {
    for (let ii = 0; ii < loops; ii++) {
      useZipSome(model)
    }
    break
  }
  case "zipless": {
    for (let ii = 0; ii < loops; ii++) {
      useZipLess(model)
    }
    break
  }
  case "precomp": {
    for (let ii = 0; ii < loops; ii++) {
      usePrecomp(model)
    }
    break
  }
  case "builder": {
    for (let ii = 0; ii < loops; ii++) {
      useBuilder(model)
    }
    break
  }
  default: {
    console.error("Unknown: " + process.argv[2])
  }
}
