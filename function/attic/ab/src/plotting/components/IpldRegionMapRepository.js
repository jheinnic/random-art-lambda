var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
// import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable } from "@nestjs/common";
import { PlottingModuleTypes } from "../di/PlottingModuleTypes.js";
import { EMPTY_DIMENSION, } from "../ipldmodel/index.js";
import { IpldRegionMap } from "./IpldRegionMap.js";
import { blockify, fractionifyBounds, fractionifyList, paletteMaybe, rationalize, stats } from "./RegionMapUtils.js";
function isCoarse(boundary) {
    return Object.keys(boundary).includes("top");
}
let IpldRegionMapRepository = class IpldRegionMapRepository {
    blockStore;
    modelEnvelopeSerdes;
    dataBlockSerdes;
    RegionMapModelBuilder;
    constructor(blockStore, modelEnvelopeSerdes, dataBlockSerdes) {
        this.blockStore = blockStore;
        this.modelEnvelopeSerdes = modelEnvelopeSerdes;
        this.dataBlockSerdes = dataBlockSerdes;
        console.log(blockStore.constructor.name);
        this.RegionMapModelBuilder = class {
            self;
            _pixelRef = "Center";
            // private _chunkHeight: number = -1
            _pixelWidth = -1;
            _pixelHeight = -1;
            _regionBoundaryFractions = { topN: 0, topD: 0, bottomN: 0, bottomD: 0, leftN: 0, leftD: 0, rightN: 0, rightD: 0 };
            _rowOrderX = EMPTY_DIMENSION;
            _rowOrderY = EMPTY_DIMENSION;
            // TODO: This ought to be configurable/discoverable and shared
            _blockWriteSize = 4096;
            constructor(self) {
                this.self = self;
            }
            pixelRef(pixelRef) {
                this._pixelRef = pixelRef;
                return this;
            }
            imageSize(pixelWidth, pixelHeight) {
                this._pixelWidth = pixelWidth;
                this._pixelHeight = pixelHeight;
                return this;
            }
            regionBoundary(boundary) {
                if (isCoarse(boundary)) {
                    this._regionBoundaryFractions = fractionifyBounds(boundary);
                }
                else {
                    this._regionBoundaryFractions = { ...boundary };
                }
                return this;
            }
            xByRows(rowOrderX) {
                this._rowOrderX = rowOrderX;
                return this;
            }
            yByRows(rowOrderY) {
                this._rowOrderY = rowOrderY;
                return this;
            }
            isProjected() {
                if ((this._rowOrderX === EMPTY_DIMENSION) || (this._rowOrderY === EMPTY_DIMENSION)) {
                    throw new Error("Data points must be defined first");
                }
                if ((this._pixelWidth === -1) || (this._pixelHeight === -1)) {
                    throw new Error("Image dimensions must be defined first");
                }
                return (this._rowOrderX.length === this._pixelWidth) && (this._rowOrderY.length === this._pixelHeight);
            }
            isComplete() {
                if ((this._rowOrderX === EMPTY_DIMENSION) || (this._rowOrderY === EMPTY_DIMENSION)) {
                    throw new Error("Data points must be defined first");
                }
                if ((this._pixelWidth === -1) || (this._pixelHeight === -1)) {
                    throw new Error("Image dimensions must be defined first");
                }
                const pixelCount = this._pixelWidth * this._pixelHeight;
                return (this._rowOrderX.length === pixelCount) && (this._rowOrderY.length === pixelCount);
            }
            async commit() {
                let leftOffset = 0;
                if (this._regionBoundaryFractions.leftN < 0) {
                    leftOffset = (this._regionBoundaryFractions.leftN / this._regionBoundaryFractions.leftD);
                }
                const _rows = fractionifyList(this._rowOrderX, leftOffset);
                stats(this._rowOrderX, rationalize(_rows, leftOffset));
                let bottomOffset = 0;
                if (this._regionBoundaryFractions.bottomN < 0) {
                    bottomOffset = (this._regionBoundaryFractions.bottomN / this._regionBoundaryFractions.bottomD);
                }
                const _cols = fractionifyList(this._rowOrderY, bottomOffset);
                stats(this._rowOrderY, rationalize(_cols, bottomOffset));
                // logFractions("ipldFractionWrites.dat", _rows, _cols, this._regionBoundary)
                const paletteMaybes = {
                    rowsN: paletteMaybe(_rows.N),
                    rowsD: paletteMaybe(_rows.D),
                    colsN: paletteMaybe(_cols.N),
                    colsD: paletteMaybe(_cols.D),
                };
                const paletteWordSizes = {
                    rowsN: paletteMaybes.rowsN.paletteWordLen,
                    rowsD: paletteMaybes.rowsD.paletteWordLen,
                    colsN: paletteMaybes.colsN.paletteWordLen,
                    colsD: paletteMaybes.colsD.paletteWordLen,
                };
                const dataWordSizes = {
                    rowsN: paletteMaybes.rowsN.baseWordLen,
                    rowsD: paletteMaybes.rowsD.baseWordLen,
                    colsN: paletteMaybes.colsN.baseWordLen,
                    colsD: paletteMaybes.colsD.baseWordLen,
                };
                console.log(paletteMaybes);
                console.log(paletteWordSizes);
                console.log(dataWordSizes);
                // const chunkHeight: number = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
                const paletteBlocks = blockify({ N: paletteMaybes.rowsN.palette, D: paletteMaybes.rowsD.palette }, { N: paletteMaybes.colsN.palette, D: paletteMaybes.colsD.palette }, this._blockWriteSize, paletteWordSizes);
                const dataBlocks = blockify(_rows, _cols, this._blockWriteSize, dataWordSizes);
                const regionMap = {
                    pixelRef: this._pixelRef,
                    imageSize: { pixelWidth: this._pixelWidth, pixelHeight: this._pixelHeight },
                    projected: this.isProjected(),
                    regionBoundary: this._regionBoundaryFractions,
                    codings: {
                        rowsN: {
                            paletteWordLen: paletteMaybes.rowsN.paletteWordLen,
                            baseWordLen: paletteMaybes.rowsN.baseWordLen
                        },
                        rowsD: {
                            paletteWordLen: paletteMaybes.rowsD.paletteWordLen,
                            baseWordLen: paletteMaybes.rowsD.baseWordLen
                        },
                        colsN: {
                            paletteWordLen: paletteMaybes.colsN.paletteWordLen,
                            baseWordLen: paletteMaybes.colsN.baseWordLen
                        },
                        colsD: {
                            paletteWordLen: paletteMaybes.colsD.paletteWordLen,
                            baseWordLen: paletteMaybes.colsD.baseWordLen
                        }
                    },
                    palettes: await this.self.commitData(paletteBlocks),
                    data: await this.self.commitData(dataBlocks),
                };
                const rootCid = await this.self.commitRoot(regionMap);
                return rootCid;
            }
        };
    }
    async commitRoot(source) {
        // validate and transform
        const value = await this.modelEnvelopeSerdes.encodeModel({ "RegionMap": source });
        // const rootBlock = await encode( { codec, hasher, value } )
        const rootCid = value.cid; // rootBlock.cid;
        // await this.blockStore.put( rootCid, rootBlock.bytes, {} )
        await this.blockStore.put(rootCid, value.bytes, {});
        return rootCid;
    }
    async commitData(data) {
        const retVal = await Promise.all(data.map(async (dataBlock) => {
            const value = await this.dataBlockSerdes.encodeModel(dataBlock);
            const blockCid = value.cid; // encodedBlock.cid
            await this.blockStore.put(blockCid, value.bytes, {});
            return blockCid;
        }));
        return retVal;
    }
    async load(cid) {
        const rootEncodingBytes = await this.blockStore.get(cid);
        // const decodedRootBlock: BlockView<ModelEnvelopeRepresentation > =
        // await decode( { codec, hasher, bytes: rootEncodingBytes } )
        const modelEnvelope = await this.modelEnvelopeSerdes.bytesToDomain(rootEncodingBytes);
        if (modelEnvelope === undefined) {
            throw new TypeError("Invalid deserialized representation, did follow from schema");
        }
        console.log(modelEnvelope);
        const rootObject = modelEnvelope['RegionMap'];
        console.log(rootObject);
        const paletteBlocks = await Promise.all(rootObject.palettes.map(async (cidLink) => {
            const dataEncodingBytes = await this.blockStore.get(cidLink);
            // const decodedDataBlock: BlockView<DataBlockRepresentation> =
            // await decode( { codec, hasher, bytes: dataEncodingBytes } )
            return this.dataBlockSerdes.bytesToDomain(dataEncodingBytes);
        }));
        const dataBlocks = await Promise.all(rootObject.data.map(async (cidLink) => {
            const dataEncodingBytes = await this.blockStore.get(cidLink);
            // const decodedDataBlock: BlockView<DataBlockRepresentation> =
            // await decode( { codec, hasher, bytes: dataEncodingBytes } )
            return this.dataBlockSerdes.bytesToDomain(dataEncodingBytes);
        }));
        return new IpldRegionMap(rootObject, paletteBlocks, dataBlocks);
    }
    async import(director) {
        const builder = new this.RegionMapModelBuilder(this);
        director(builder);
        return await builder.commit();
    }
};
IpldRegionMapRepository = __decorate([
    Injectable(),
    __param(0, Inject(PlottingModuleTypes.InjectedBlockStore)),
    __param(1, Inject(PlottingModuleTypes.IModelEnvelopeSerdes)),
    __param(2, Inject(PlottingModuleTypes.IDataBlockSerdes)),
    __metadata("design:paramtypes", [Object, Object, Object])
], IpldRegionMapRepository);
export { IpldRegionMapRepository };
// function logFractions (rows: Fractions, cols: Fractions, regionBoundary: RegionBoundary): void {
//   let bottomOffset = 0
//   if (region.bottomN < 0) {
//     bottomOffset = region.bottomN / region.bottomD
//   }
//   let leftOffset = 0
//   if (region.leftN < 0) {
//     leftOffset = region.leftN / region.leftD
//   }
//   const outStream = fs.createWriteStream("ipldFractionLog.dat")
//   const size = rows.N.length
//   const messages = []
//   let index = 0
//   for (index = 0; index < size; index++) {
//     messages.push(`${index + 1} ::\n\t([${rows.N[index]}/${rows.D[index]}], [${cols.N[index]}/${cols.D[index]}]) => (${(rows.N[index] / rows.D[index]) + leftOffset}, ${(cols.N[index], cols.D[index]) + bottomOffset})`)
//     if ((index % 16384) === 16383) {
//       outStream.write(
//         Buffer.from(
//           messages.slice(0).join("\n")
//         )
//       )
//     }
//   }
//   outStream.write(
//     Buffer.from(
//       messages.slice(0).join("\n")
//     )
//   )
//   outStream.close()
// }
//# sourceMappingURL=IpldRegionMapRepository.js.map