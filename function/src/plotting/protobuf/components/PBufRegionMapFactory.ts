import { Injectable } from "@nestjs/common"
import * as fs from "fs"

import { PBufRegionMap } from "./PBufRegionMap.js"
import { PointPlotDocument, PointPlotData } from "./PBufUtil.js"

@Injectable()
export class PBufRegionMapFactory {
   public adapt(sourceFile: string): PBufRegionMap
   public adapt(sourceFile: Buffer): PBufRegionMap
   public adapt(sourceFile: string | Buffer): PBufRegionMap {
      const sourceBuf: Buffer =
         typeof sourceFile === "string"
            ? fs.readFileSync(sourceFile)
            : sourceFile
      const plotDocument = PointPlotDocument.deserializeBinary(sourceBuf)
      const plotData: PointPlotData | undefined = plotDocument.getData()

      if (plotData === undefined || plotData === null) {
         console.error("Not Plot Data!")
         throw new Error("Not Plot Data!")
      }

      return new PBufRegionMap(plotData)
   }
}
