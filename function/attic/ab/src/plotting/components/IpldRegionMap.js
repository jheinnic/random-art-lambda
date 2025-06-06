import { AbstractRegionMap } from "./AbstractRegionMap.js";
import { unblockify, rationalize } from "./RegionMapUtils.js";
export class IpldRegionMap extends AbstractRegionMap {
    regionMap;
    paletteBlocks;
    dataBlocks;
    rowList;
    colList;
    constructor(regionMap, paletteBlocks, dataBlocks) {
        super();
        this.regionMap = regionMap;
        this.paletteBlocks = paletteBlocks;
        this.dataBlocks = dataBlocks;
        const boundary = regionMap.regionBoundary;
        const codings = regionMap.codings;
        const rowsN = unblockify(dataBlocks, paletteBlocks, (x) => x.rowsN, codings.rowsN);
        const rowsD = unblockify(dataBlocks, paletteBlocks, (x) => x.rowsD, codings.rowsD);
        const colsN = unblockify(dataBlocks, paletteBlocks, (x) => x.colsN, codings.colsN);
        const colsD = unblockify(dataBlocks, paletteBlocks, (x) => x.colsD, codings.colsD);
        const leftOffset = (boundary.leftN < 0) ? (boundary.leftN / boundary.leftD) : 0;
        const bottomOffset = (boundary.bottomN < 0) ? (boundary.bottomN / boundary.bottomD) : 0;
        this.rowList = rationalize({ N: rowsN, D: rowsD }, leftOffset);
        this.colList = rationalize({ N: colsN, D: colsD }, bottomOffset);
        //logFractions("ipldFractionReads.dat", rows, cols, boundary)
    }
    get columnOrderedXCoordinates() {
        return [...this.rowList];
    }
    get columnOrderedYCoordinates() {
        return [...this.colList];
    }
    get pixelHeight() {
        return this.regionMap.imageSize.pixelHeight;
    }
    get pixelWidth() {
        return this.regionMap.imageSize.pixelWidth;
    }
    get isUniform() {
        return this.regionMap.projected;
    }
}
//# sourceMappingURL=IpldRegionMap.js.map