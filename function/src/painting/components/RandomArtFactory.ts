import { Injectable } from "@nestjs/common"
import { Canvas } from "canvas"

import { IRegionMap } from "../../plotting/interface/index.js"
import { PBufRegionMap } from "../../plotting/protobuf/PBufRegionMap.js"
import { ImageSize, PointPlotData, PointPlotDocument } from "../../plotting/protobuf/plot_mapping_pb"
import { ICompleteObserver, IPixelPainter, IRandomArtFactory } from "../interface/index.js"
import { GenModel, newPicture } from "./genjs6.js"
import { RandomArtTask } from "./RandomArtTask.js"

@Injectable()
export class RandomArtFactory implements IRandomArtFactory {
  public allocateGenModel (modelSeed: RandomArtTask): GenModel {
    const prefix = [...modelSeed.prefix]
    const suffix = [...modelSeed.suffix]

    // if (modelSeed.novel) {
    //   return new_new_picture(prefix, suffix)
    // }

    return newPicture(prefix, suffix)
  }

  public allocateCanvas (plotPoint: ImageSize.AsObject): Canvas {
    return new Canvas(plotPoint.pixelwidth, plotPoint.pixelheight)
  }

  public alllocateRegionMap (encodedModel: Uint8Array): IRegionMap {
    const plotDocument: PointPlotDocument =
      PointPlotDocument.deserializeBinary(encodedModel)
    const plotData: PointPlotData | undefined = plotDocument.getData()
    if (plotData === undefined) {
      throw new Error("Plot document lacks a data payload")
    }
    return new PBufRegionMap(plotData)
  }

  public allocatePainter (genModel: GenModel, plotter: IRegionMap, canvas: Canvas): IPixelPainter {
    throw new Error()
  }

  public allocateWriter (canvas: Canvas, pngSink: WritableStream): ICompleteObserver {
    throw new Error()
  }
}
