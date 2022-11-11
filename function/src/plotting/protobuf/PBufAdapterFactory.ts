import { Inject, Injectable } from "@nestjs/common"
import * as fs from "fs"
import { CID } from "multiformats/cid"

import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { PlottingModuleTypes } from "../di/index.js"
import { IRegionMapBuilder } from "../interface/index.js"
import { Numeric, RegionBoundaries } from "../interface/RegionMapSchemaTypes.js"
import { PBufAdapter } from "./PBufAdapter.js"
import { PointPlotData, PointPlotDocument, RefPoint } from "./PBufUtil.mjs"

@Injectable()
export class PBufAdapterFactory {
  public adapt (sourceFile: string): PBufAdapter {
    const modelBuf = fs.readFileSync(sourceFile)
    const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
    const plotData = plotDocument.getData()
    if ((plotData === undefined) || (plotData === null)) {
      console.error("Not Plot Data!")
      throw new Error("Not Plot Data!")
    }
    return new PBufAdapter(plotData)
  }
}
