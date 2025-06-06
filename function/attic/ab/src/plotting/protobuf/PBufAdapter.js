import { PBufRegionMap } from "../protobuf/PBufRegionMap.js";
import { RefPoint } from "./PBufUtil.js";
// import { PointPlotData, RefPoint } from "./plot_mapping_pb.js"
export class PBufAdapter {
    source;
    constructor(source) {
        this.source = source;
    }
    asDirector() {
        return (builder) => {
            const resolution = this.source.getResolution();
            if ((resolution === undefined) || (resolution === null)) {
                throw new Error("Resolution must be defined");
            }
            const mappedRegion = this.source.getMappedRegion();
            if ((mappedRegion === undefined) || (mappedRegion === null)) {
                throw new Error("Mapped region must be defined");
            }
            builder.pixelRef(this.source.getPixelref() === RefPoint.CENTER ? "Center" : "TopLeft")
                // .chunkHeight( chunkHeight )
                .imageSize(resolution.getPixelwidth(), resolution.getPixelheight())
                .regionBoundary(mappedRegion.toObject())
                .xByRows(this.source.getRowsList())
                .yByRows(this.source.getColumnsList());
        };
    }
    asRegionMap() {
        return new PBufRegionMap(this.source);
    }
}
//# sourceMappingURL=PBufAdapter.js.map