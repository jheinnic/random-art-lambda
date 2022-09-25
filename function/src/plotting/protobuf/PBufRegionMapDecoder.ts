import { Injectable } from "@nestjs/common"

import { IRegionMap, IRegionMapDecoder } from "../../painting/interface"
import { PBufRegionMap } from "./PBufRegionMap.js"
import { PointPlotData, PointPlotDocument } from "./plot_mapping_pb.mjs"

@Injectable()
export class PBufRegionMapDecoder implements IRegionMapDecoder {
  async provide (modelBuf: Uint8Array): Promise<IRegionMap> {
    const plotDocument: PointPlotDocument =
      PointPlotDocument.deserializeBinary(modelBuf)
    const plotData: PointPlotData | undefined = plotDocument.getData()
    if (plotData === undefined) {
      throw new Error("Plot document block lacks a payload?")
    }
    return new PBufPlotModel(plotData)
  }
}
