import { AbstractRegionMap } from "../components/AbstractRegionMap.js";
// import { PointPlotData } from "./plot_mapping_pb.js"
// <reference path="./plot_mapping_pb.d.ts"/>
export class PBufRegionMap extends AbstractRegionMap {
    _data;
    constructor(_data) {
        super();
        this._data = _data;
    }
    get columnOrderedXCoordinates() {
        return this._data.getRowsList();
    }
    get columnOrderedYCoordinates() {
        return this._data.getColumnsList();
    }
    get pixelHeight() {
        const data = this._data.getResolution();
        if (data === undefined && !this._data.getUniform()) {
            throw new Error("Image resolution must be defined");
        }
        return data?.getPixelheight() ?? this._data.getRowsList().length;
    }
    get pixelWidth() {
        const data = this._data.getResolution();
        if (data === undefined && !this._data.getUniform()) {
            throw new Error("Image resolution must be defined");
        }
        return data?.getPixelwidth() ?? this._data.getColumnsList().length;
    }
    get isUniform() {
        return this._data.getUniform();
    }
}
//# sourceMappingURL=PBufRegionMap.js.map