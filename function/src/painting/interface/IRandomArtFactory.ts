import { Canvas } from "canvas"

import { IRegionMap } from "../../plotting/interface/index.js"
import { ImageSize } from "../../plotting/protobuf/plot_mapping_pb"
import { GenModel } from "../components/genjs6.js"
import { RandomArtTask } from "../components/RandomArtTask.js"
import { ICompleteObserver } from "./ICompleteObserver.js"
import { IPixelPainter } from "./IPixelPainter.js"

export interface IRandomArtFactory {
  allocateGenModel: (modelSeed: RandomArtTask) => GenModel

  allocateCanvas: (plotMap: ImageSize.AsObject) => Canvas

  allocatePainter: (
    genModel: GenModel,
    plotter: IRegionMap,
    canvas: Canvas
  ) => IPixelPainter

  allocateWriter: (canvas: Canvas, pngSink: WritableStream) => ICompleteObserver
}
