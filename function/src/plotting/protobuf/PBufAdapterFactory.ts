import { Injectable } from "@nestjs/common"
import * as fs from "fs"

import { PBufAdapter } from "./PBufAdapter.js"
import { PointPlotDocument } from "./PBufUtil.mjs"

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
