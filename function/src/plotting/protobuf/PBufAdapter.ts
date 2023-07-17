import { IRegionMap, IRegionMapBuilder } from "../interface/index.js"
import { PBufRegionMap } from "../protobuf/PBufRegionMap.js"
// import { PointPlotData, RefPoint } from "./PBufUtil.mjs"
import { PointPlotData, RefPoint } from "./plot_mapping_pb.mjs"

export class PBufAdapter {
  public constructor ( private readonly source: PointPlotData ) { }

  public asDirector( chunkHeight: number ): ( builder: IRegionMapBuilder ) => void {
    return ( builder: IRegionMapBuilder ) => {
      const resolution = this.source.getResolution()
      if ( ( resolution === undefined ) || ( resolution === null ) ) {
        throw new Error( "Resolution must be defined" )
      }
      const mappedRegion = this.source.getMappedRegion()
      if ( ( mappedRegion === undefined ) || ( mappedRegion === null ) ) {
        throw new Error( "Mapped region must be defined" )
      }
      builder.pixelRef( this.source.getPixelref() === RefPoint.CENTER ? "Center" : "TopLeft" )
        .chunkHeight( chunkHeight )
        .imageSize( resolution.getPixelwidth(), resolution.getPixelheight() )
        .regionBoundary( mappedRegion.toObject() )
        .xByRows( this.source.getRowsList() )
        .yByRows( this.source.getColumnsList() )
    }
  }

  public asRegionMap(): IRegionMap {
    return new PBufRegionMap( this.source )
  }
}
