import { Canvas } from "canvas"

import { ImageSize } from "../../plotting/protobuf/plot_mapping_pb"
import { GenModel } from "../components/genjs6.js"
import { RandomArtTask } from "../components/RandomArtTask.js"
import { IRegionMap } from "../interface/IRegionMap.js"
import { IRandomArtWriter } from "./ICanvasWriter.js"
import { IRandomArtPainter } from "./IRandomArtPainter.js"

export interface IRandomArtFactory {
  allocateGenModel: (modelSeed: RandomArtTask) => GenModel

  allocateCanvas: (plotMap: ImageSize.AsObject) => Canvas

  allocatePainter: (
    genModel: GenModel,
    plotter: IRegionMap,
    canvas: Canvas
  ) => IRandomArtPainter

  allocateWriter: (canvas: Canvas, pngSink: WritableStream) => IRandomArtWriter
}
