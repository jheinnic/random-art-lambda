import { Inject, Injectable } from "@nestjs/common"
import * as fs from "fs"
import { CID } from "multiformats/cid"

import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { PlottingModuleTypes } from "../di/typez.js"
import { IRegionMapBuilder } from "../interface/IRegionMapBuilder.js"
import { Numeric, RegionBoundaries } from "../interface/RegionMapSchemaTypes.js"
import { PointPlotData, PointPlotDocument, RefPoint } from "./plot_mapping_pb.mjs"

@Injectable()
export class PBufAdapter {
  constructor (
    @Inject(PlottingModuleTypes.IpldRegionMapRepository) private readonly repository: IpldRegionMapRepository
  ) {
  }

  public async import (sourceFile: string, chunkHeight: number): Promise<CID> {
    const modelBuf = fs.readFileSync(sourceFile)
    const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
    const plotData = plotDocument.getData()
    if ((plotData === undefined) || (plotData === null)) {
      console.error("Not Plot Data!")
      throw new Error()
    }
    return await this.transfer(plotData, chunkHeight)
  }

  public async transfer (source: PointPlotData, chunkHeight: number): Promise<CID> {
    return await this.repository.import(
      (builder: IRegionMapBuilder) => {
        const resolution = source.getResolution()
        if ((resolution === undefined) || (resolution === null)) {
          throw new Error("Resolution must be defined")
        }
        const mappedRegion = source.getMappedRegion()
        if ((mappedRegion === undefined) || (mappedRegion === null)) {
          throw new Error("Mapped region must be defined")
        }
        builder.pixelRef(source.getPixelref() === RefPoint.CENTER ? "Center" : "TopLeft")
          .chunkHeight(chunkHeight)
          .imageSize(resolution.getPixelwidth(), resolution.getPixelheight())
          .regionBoundary(mappedRegion.toObject())
          .xByRows(source.getRowsList())
          .yByRows(source.getColumnsList())
      }
    )
  }
}
