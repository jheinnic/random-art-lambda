// import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable } from "@nestjs/common"
import type { Blockstore } from "interface-blockstore"
import { BlockView, ByteView, CID } from "multiformats"
// import { decode, encode } from "multiformats/block"
// import { sha256 as hasher } from "multiformats/hashes/sha2"

import { IpldPlottingModuleTypes } from "../di/Types.js"
import type { IRegionMapBuilder } from "../../interface/IRegionMapBuilder.js"
import type { IRegionMapRepository } from "../../interface/IRegionMapRepository.js"
import type {
   IDataBlockSerdes,
   DataBlock,
   DataBlockRepresentation,
} from "../ipldmodel/DataBlock.js"
import type {
   IModelEnvelopeSerdes,
   ModelEnvelope,
   ModelEnvelopeRepresentation,
} from "../ipldmodel/ModelEnvelope.js"
import type { RegionMap } from "../ipldmodel/RegionMap.js"
import type {
   FractionList,
   RegionBoundaries,
   RegionBoundaryFractions,
   WordSizes,
} from "../ipldmodel/OtherDataTypes.js"

import { EMPTY_DIMENSION } from "../ipldmodel/OtherDataTypes.js"
import { AbstractRegionMap } from "../../components/AbstractRegionMap.js"
import { IpldRegionMap } from "./IpldRegionMap.js"
import {
   blockify,
   fractionifyBounds,
   fractionifyList,
   paletteMaybe,
   rationalize,
   stats,
   PaletteMaybe,
} from "./RegionMapUtils.js"

function isCoarse(
   boundary: RegionBoundaries | RegionBoundaryFractions,
): boundary is RegionBoundaries {
   return Object.keys(boundary).includes("top")
}

@Injectable()
export class IpldRegionMapRepository implements IRegionMapRepository {
   private readonly RegionMapModelBuilder

   constructor(
      @Inject(IpldPlottingModuleTypes.InjectedBlockStore)
      private readonly blockStore: Blockstore,
      @Inject(IpldPlottingModuleTypes.IModelEnvelopeSerdes)
      private readonly modelEnvelopeSerdes: IModelEnvelopeSerdes,
      @Inject(IpldPlottingModuleTypes.IDataBlockSerdes)
      private readonly dataBlockSerdes: IDataBlockSerdes,
   ) {
      console.log(blockStore.constructor.name)
      this.RegionMapModelBuilder = class implements IRegionMapBuilder {
         private _pixelRef: "Center" | "TopLeft" = "Center"
         // private _chunkHeight: number = -1
         private _pixelWidth: number = -1
         private _pixelHeight: number = -1
         private _regionBoundaryFractions: RegionBoundaryFractions = {
            topN: 0,
            topD: 0,
            bottomN: 0,
            bottomD: 0,
            leftN: 0,
            leftD: 0,
            rightN: 0,
            rightD: 0,
         }

         private _rowOrderX: readonly number[] = EMPTY_DIMENSION
         private _rowOrderY: readonly number[] = EMPTY_DIMENSION

         // TODO: This ought to be configurable/discoverable and shared
         private readonly _blockWriteSize: number = 4096

         constructor(private readonly self: IpldRegionMapRepository) {}

         public pixelRef(pixelRef: "Center" | "TopLeft"): IRegionMapBuilder {
            this._pixelRef = pixelRef
            return this
         }

         public imageSize(
            pixelWidth: number,
            pixelHeight: number,
         ): IRegionMapBuilder {
            this._pixelWidth = pixelWidth
            this._pixelHeight = pixelHeight
            return this
         }

         // public chunkHeight( chunkHeight: number ): IRegionMapBuilder {
         // this._chunkHeight = chunkHeight
         // return this
         // }

         public regionBoundary(boundary: RegionBoundaries): IRegionMapBuilder
         public regionBoundary(
            boundary: RegionBoundaryFractions,
         ): IRegionMapBuilder
         public regionBoundary(
            boundary: RegionBoundaries | RegionBoundaryFractions,
         ): IRegionMapBuilder {
            if (isCoarse(boundary)) {
               this._regionBoundaryFractions = fractionifyBounds(boundary)
            } else {
               this._regionBoundaryFractions = { ...boundary }
            }
            return this
         }

         public xByRows(rowOrderX: readonly number[]): IRegionMapBuilder {
            this._rowOrderX = rowOrderX
            return this
         }

         public yByRows(rowOrderY: readonly number[]): IRegionMapBuilder {
            this._rowOrderY = rowOrderY
            return this
         }

         private isProjected(): boolean {
            if (
               this._rowOrderX === EMPTY_DIMENSION ||
               this._rowOrderY === EMPTY_DIMENSION
            ) {
               throw new Error("Data points must be defined first")
            }
            if (this._pixelWidth === -1 || this._pixelHeight === -1) {
               throw new Error("Image dimensions must be defined first")
            }
            return (
               this._rowOrderX.length === this._pixelWidth &&
               this._rowOrderY.length === this._pixelHeight
            )
         }

         private isComplete(): boolean {
            if (
               this._rowOrderX === EMPTY_DIMENSION ||
               this._rowOrderY === EMPTY_DIMENSION
            ) {
               throw new Error("Data points must be defined first")
            }
            if (this._pixelWidth === -1 || this._pixelHeight === -1) {
               throw new Error("Image dimensions must be defined first")
            }
            const pixelCount = this._pixelWidth * this._pixelHeight
            return (
               this._rowOrderX.length === pixelCount &&
               this._rowOrderY.length === pixelCount
            )
         }

         async commit(): Promise<CID> {
            const leftOffset =
               this._regionBoundaryFractions.leftN /
               this._regionBoundaryFractions.leftD
            const _rows: FractionList = fractionifyList(
               this._rowOrderX,
               leftOffset,
            )
            stats(this._rowOrderX, rationalize(_rows, leftOffset))

            const bottomOffset =
               this._regionBoundaryFractions.bottomN /
               this._regionBoundaryFractions.bottomD
            const _cols: FractionList = fractionifyList(
               this._rowOrderY,
               bottomOffset,
            )
            stats(this._rowOrderY, rationalize(_cols, bottomOffset))

            // logFractions("ipldFractionWrites.dat", _rows, _cols, this._regionBoundary)
            const paletteMaybes: Record<
               "rowsN" | "rowsD" | "colsN" | "colsD",
               PaletteMaybe
            > = {
               rowsN: paletteMaybe(_rows.N),
               rowsD: paletteMaybe(_rows.D),
               colsN: paletteMaybe(_cols.N),
               colsD: paletteMaybe(_cols.D),
            }
            const paletteWordSizes: WordSizes = {
               rowsN: paletteMaybes.rowsN.paletteWordLen,
               rowsD: paletteMaybes.rowsD.paletteWordLen,
               colsN: paletteMaybes.colsN.paletteWordLen,
               colsD: paletteMaybes.colsD.paletteWordLen,
            }
            const dataWordSizes: WordSizes = {
               rowsN: paletteMaybes.rowsN.baseWordLen,
               rowsD: paletteMaybes.rowsD.baseWordLen,
               colsN: paletteMaybes.colsN.baseWordLen,
               colsD: paletteMaybes.colsD.baseWordLen,
            }
            console.log(paletteMaybes)
            console.log(paletteWordSizes)
            console.log(dataWordSizes)
            // const chunkHeight: number = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
            const paletteBlocks: readonly DataBlock[] = blockify(
               {
                  N: paletteMaybes.rowsN.palette,
                  D: paletteMaybes.rowsD.palette,
               },
               {
                  N: paletteMaybes.colsN.palette,
                  D: paletteMaybes.colsD.palette,
               },
               this._blockWriteSize,
               paletteWordSizes,
            )
            const dataBlocks: readonly DataBlock[] = blockify(
               {
                  N: paletteMaybes.rowsN.data,
                  D: paletteMaybes.rowsD.data,
               },
               {
                  N: paletteMaybes.colsN.data,
                  D: paletteMaybes.colsD.data,
               },
               this._blockWriteSize,
               dataWordSizes,
            )

            const regionMap: RegionMap = {
               pixelRef: this._pixelRef,
               imageSize: {
                  pixelWidth: this._pixelWidth,
                  pixelHeight: this._pixelHeight,
               },
               projected: this.isProjected(),
               regionBoundary: this._regionBoundaryFractions,
               codings: {
                  rowsN: {
                     paletteWordLen: paletteMaybes.rowsN.paletteWordLen,
                     baseWordLen: paletteMaybes.rowsN.baseWordLen,
                  },
                  rowsD: {
                     paletteWordLen: paletteMaybes.rowsD.paletteWordLen,
                     baseWordLen: paletteMaybes.rowsD.baseWordLen,
                  },
                  colsN: {
                     paletteWordLen: paletteMaybes.colsN.paletteWordLen,
                     baseWordLen: paletteMaybes.colsN.baseWordLen,
                  },
                  colsD: {
                     paletteWordLen: paletteMaybes.colsD.paletteWordLen,
                     baseWordLen: paletteMaybes.colsD.baseWordLen,
                  },
               },
               palettes: await this.self.commitData(paletteBlocks),
               data: await this.self.commitData(dataBlocks),
            }
            const rootCid: CID = await this.self.commitRoot(regionMap)
            return rootCid
         }
      }
   }

   private async commitRoot(source: RegionMap): Promise<CID> {
      // validate and transform
      const value: BlockView<ModelEnvelopeRepresentation> =
         await this.modelEnvelopeSerdes.encodeModel({ RegionMap: source })

      // const rootBlock = await encode( { codec, hasher, value } )
      const rootCid: CID = value.cid // rootBlock.cid;
      // await this.blockStore.put( rootCid, rootBlock.bytes, {} )
      await this.blockStore.put(rootCid, value.bytes, {})
      return rootCid
   }

   private async commitData(data: readonly DataBlock[]): Promise<CID[]> {
      const retVal: CID[] = await Promise.all(
         data.map(async (dataBlock: DataBlock) => {
            const value: BlockView<DataBlockRepresentation> =
               await this.dataBlockSerdes.encodeModel(dataBlock)
            const blockCid: CID = value.cid // encodedBlock.cid
            await this.blockStore.put(blockCid, value.bytes, {})
            return blockCid
         }),
      )
      return retVal
   }

   public async load(cid: CID): Promise<AbstractRegionMap> {
      const rootEncodingBytes: ByteView<ModelEnvelopeRepresentation> =
         await this.blockStore.get(cid)
      // const decodedRootBlock: BlockView<ModelEnvelopeRepresentation > =
      // await decode( { codec, hasher, bytes: rootEncodingBytes } )
      const modelEnvelope: ModelEnvelope =
         await this.modelEnvelopeSerdes.bytesToDomain(rootEncodingBytes)
      if (modelEnvelope === undefined) {
         throw new TypeError(
            "Invalid deserialized representation, did follow from schema",
         )
      }
      console.log(modelEnvelope)
      const rootObject: RegionMap = modelEnvelope.RegionMap
      console.log(rootObject)
      const paletteBlocks: readonly DataBlock[] = await Promise.all(
         rootObject.palettes.map(async (cidLink: CID) => {
            const dataEncodingBytes: ByteView<DataBlockRepresentation> =
               await this.blockStore.get(cidLink)
            // const decodedDataBlock: BlockView<DataBlockRepresentation> =
            // await decode( { codec, hasher, bytes: dataEncodingBytes } )
            return await this.dataBlockSerdes.bytesToDomain(dataEncodingBytes)
         }),
      )
      const dataBlocks: readonly DataBlock[] = await Promise.all(
         rootObject.data.map(async (cidLink: CID) => {
            const dataEncodingBytes: ByteView<DataBlockRepresentation> =
               await this.blockStore.get(cidLink)
            // const decodedDataBlock: BlockView<DataBlockRepresentation> =
            // await decode( { codec, hasher, bytes: dataEncodingBytes } )
            return await this.dataBlockSerdes.bytesToDomain(dataEncodingBytes)
         }),
      )
      return new IpldRegionMap(rootObject, paletteBlocks, dataBlocks)
   }

   public async import(
      director: (builder: IRegionMapBuilder) => void,
   ): Promise<CID> {
      const builder = new this.RegionMapModelBuilder(this)
      director(builder)
      return await builder.commit()
   }
}

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
