import { Injectable } from "@nestjs/common"

import { IRegionMap, IRegionMapDecoder } from "../../painting/interface"
import { PBufRegionMap } from "./PBufRegionMap.js"
import { PointPlotDocument } from "./plot_mapping_pb.mjs"

@Injectable()
export class PBufRegionMapDecoder implements IRegionMapDecoder {
  async provide (modelBuf: Uint8Array): Promise<IRegionMap> {
    const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
    const plotData = plotDocument.getData()
    if (plotData === undefined) {
      throw new Error("Plot document block lacks a payload?")
    }
    return new PBufRegionMap(plotData)
  }
}
