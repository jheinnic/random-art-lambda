import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats/cid"

import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { PlottingModuleTypes } from "../di/typez.js"
import { IRegionMapBuilder } from "../interface/IRegionMapBuilder"
import { Numeric, RegionBoundaries } from "../interface/RegionMapSchemaTypes.js"
import { PointPlotData, RefPoint } from "./plot_mapping_pb"

@Injectable()
export class PBufAdapter {
  constructor (
    @Inject(PlottingModuleTypes.IpldRegionMapRepository) private readonly repository: IpldRegionMapRepository
  ) {
  }

  async transfer (source: PointPlotData, chunkHeight: number): Promise<CID> {
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
