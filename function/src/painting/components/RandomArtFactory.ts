import { Injectable } from "@nestjs/common"
import { Canvas } from "canvas"

import { IPlotModel } from "../interface/IPlotModel.js"
import { IRandomArtFactory } from "../interface/IRandomArtFactory.js"
import { IRandomArtPainter } from "../interface/IRandomArtPainter.js"
import { GenModel, newPicture } from "./genjs6.js"
import { RandomArtTask } from "./RandomArtTask.js"

@Injectable()
export class RandomArtFactory implements IRandomArtFactory {
  public allocateGenModel (modelSeed: RandomArtTask): GenModel {
    const prefix = [...modelSeed.prefixBytes]
    const suffix = [...modelSeed.suffixBytes]

    // if (modelSeed.novel) {
    //   return new_new_picture(prefix, suffix)
    // }

    return newPicture(prefix, suffix)
  }

  // public allocateCanvas (plotPoint: PlotPoint): Canvas {
  // return new Canvas(plotPoint.x, plotPoint.y)
  // }

  public alllocatePlotModel (encodedModel: Uint8Array): IPlotModel {
    const plotDocument: PointPlotDocument =
      PointPlotDocument.deserializeBinary(encodedModel)
    const plotData: PointPlotData | undefined = plotDocument.getData()
    if (plotData === undefined) {
      throw new Error("Plot document lacks a data payload")
    }
    return new PBufPlotModel(plotData)
  }

  public allocatePainter (genModel: GenModel, plotter: IPlotModel, canvas: Canvas): IRandomArtPainter {
    throw new Error()
  }

  public allocateWriter (canvas: Canvas, pngSink: WritableStream): IRandomArtWriter {
    throw new Error()
  }
}
