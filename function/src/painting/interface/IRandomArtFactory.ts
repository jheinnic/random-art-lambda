import { Canvas } from "canvas"

import { RandomArtTask } from "../../domain/components/models/RandomArtTask.js"
import { IPlotModel } from "../../plotting/interface/IPlotModel.js"
import { PointPlotData } from "../../plotting/protobuf/plot_mapping_pb.js"
import { GenModel } from "../components/genjs6.js"
import { IRandomArtWriter } from "./ICanvasWriter.js"
import { IRandomArtPainter } from "./IRandomArtPainter.js"

export interface IRandomArtFactory {
  allocateGenModel: (modelSeed: RandomArtTask) => GenModel

  allocateCanvas: (plotMap: PointPlotData) => Canvas

  allocatePainter: (
    genModel: GenModel,
    plotter: IPlotModel,
    canvas: Canvas
  ) => IRandomArtPainter

  allocateWriter: (canvas: Canvas, pngSink: WritableStream) => IRandomArtWriter
}
