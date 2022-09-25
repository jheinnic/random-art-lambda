import { Inject, Injectable } from "@nestjs/common"
import { CID } from "multiformats/cid"

import { IpldRegionMapRepository } from "../components/IpldRegionMapRepository.js"
import { PlottingModuleTypes } from "../di/typez.js"
import { IRegionMapBuilder } from "../interface/IRegionMapBuilder"
import { PointPlotData, RefPoint } from "../protobuf/plot_mapping_pb.mjs"

@Injectable()
export class ProtobufAdapter {
  constructor (
    @Inject(PlottingModuleTypes.IpldRegionMapRepository) private readonly repository: IpldRegionMapRepository
  ) {
  }

  async transfer (source: PointPlotData, chunkHeight: number): Promise<CID> {
    return await this.repository.import(
      (builder: IRegionMapBuilder) => {
        builder.pixelRef(source.getPixelref() === RefPoint.CENTER ? "Center" : "TopLeft")
          .chunkHeight(chunkHeight)
          .imageSize(source.getResolution().getPixelwidth(), source.getResolution().getPixelheight())
          .regionBoundary(source.getMappedRegion().toObject())
          .xByRows(source.getRowsList())
          .yByRows(source.getColumnsList())
      }
    )
  }
}
