import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { BlockView, ByteView, CID } from "multiformats"
import { decode, encode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import { Optional } from "simplytyped"

import { PlottingModuleTypes } from "../di/PlottingModuleTypes.js"
import { IRegionMapBuilder } from "../interface/IRegionMapBuilder.js"
import { IRegionMapRepository } from "../interface/IRegionMapRepository.js"
import {
  DataBlock,
  DataBlockRepresentation,
  IDataBlockSerdes,
  DimensionLayouts,
  EMPTY_DIMENSION,
  FractionList,
  ModelEnvelope,
  ModelEnvelopeRepresentation,
  IModelEnvelopeSerdes,
  RegionBoundaries,
  RegionBoundaryFractions,
  RegionMap,
  WordSizes,
} from "../ipldmodel/index.js"
import { AbstractRegionMap } from "./AbstractRegionMap.js"
import { IpldRegionMap } from "./IpldRegionMap.js"
import { blockify, fractionifyBounds, fractionifyList, paletteMaybe, rationalize, stats } from "./RegionMapUtils.js"


function isCoarse( boundary: RegionBoundaries | RegionBoundaryFractions ): boundary is RegionBoundaries {
  return Object.keys( boundary ).includes( "top" )
}

@Injectable()
export class IpldRegionMapRepository implements IRegionMapRepository {
  private RegionMapModelBuilder

  constructor (
    @Inject( PlottingModuleTypes.InjectedBlockStore ) private readonly blockStore: Blockstore,
    @Inject( PlottingModuleTypes.IModelEnvelopeSerdes ) private readonly modelEnvelopeSerdes: IModelEnvelopeSerdes,
    @Inject( PlottingModuleTypes.IDataBlockSerdes ) private readonly dataBlockSerdes: IDataBlockSerdes
  ) {
    console.log( blockStore.constructor.name )
    this.RegionMapModelBuilder = class implements IRegionMapBuilder {
      private _pixelRef: "Center" | "TopLeft" = "Center"
      private _chunkHeight: number = -1
      private _pixelWidth: number = -1
      private _pixelHeight: number = -1
      private _regionBoundary: RegionBoundaryFractions = { topN: 0, topD: 0, bottomN: 0, bottomD: 0, leftN: 0, leftD: 0, rightN: 0, rightD: 0 }
      private _rowOrderX: number[] = EMPTY_DIMENSION
      private _rowOrderY: number[] = EMPTY_DIMENSION

      constructor ( private self: IpldRegionMapRepository ) { }

      public pixelRef( pixelRef: "Center" | "TopLeft" ): IRegionMapBuilder {
        this._pixelRef = pixelRef
        return this
      }

      public imageSize( pixelWidth: number, pixelHeight: number ): IRegionMapBuilder {
        this._pixelWidth = pixelWidth
        this._pixelHeight = pixelHeight
        return this
      }

      public chunkHeight( chunkHeight: number ): IRegionMapBuilder {
        this._chunkHeight = chunkHeight
        return this
      }

      // public regionBoundary( boundary: RegionBoundaries ): IRegionMapBuilder
      // public regionBoundary( boundary: RegionBoundaryFractions ): IRegionMapBuilder
      public regionBoundary( boundary: RegionBoundaries | RegionBoundaryFractions ): IRegionMapBuilder {
        if ( isCoarse( boundary ) ) {
          this._regionBoundary = fractionifyBounds( boundary )
        } else {
          this._regionBoundary = { ...boundary }
        }
        return this
      }

      public xByRows( rowOrderX: number[] ): IRegionMapBuilder {
        this._rowOrderX = rowOrderX
        return this
      }

      public yByRows( rowOrderY: number[] ): IRegionMapBuilder {
        this._rowOrderY = rowOrderY
        return this
      }

      private isProjected(): boolean {
        if ( ( this._rowOrderX === EMPTY_DIMENSION ) || ( this._rowOrderY === EMPTY_DIMENSION ) ) {
          throw new Error( "Data points must be defined first" )
        }
        if ( ( this._pixelWidth === -1 ) || ( this._pixelHeight === -1 ) ) {
          throw new Error( "Image dimensions must be defined first" )
        }
        return ( this._rowOrderX.length === this._pixelWidth ) && ( this._rowOrderY.length === this._pixelHeight )
      }

      private isComplete(): boolean {
        if ( ( this._rowOrderX === EMPTY_DIMENSION ) || ( this._rowOrderY === EMPTY_DIMENSION ) ) {
          throw new Error( "Data points must be defined first" )
        }
        if ( ( this._pixelWidth === -1 ) || ( this._pixelHeight === -1 ) ) {
          throw new Error( "Image dimensions must be defined first" )
        }
        const pixelCount = this._pixelWidth * this._pixelHeight
        return ( this._rowOrderX.length === pixelCount ) && ( this._rowOrderY.length === pixelCount )
      }

      async commit(): Promise<CID> {
        let leftOffset = 0
        if ( this._regionBoundary.leftN < 0 ) {
          leftOffset = ( this._regionBoundary.leftN / this._regionBoundary.leftD )
        }
        const _rows: FractionList = fractionifyList( this._rowOrderX, leftOffset )
        stats( this._rowOrderX, rationalize( _rows, leftOffset ) )

        let bottomOffset = 0
        if ( this._regionBoundary.bottomN < 0 ) {
          bottomOffset = ( this._regionBoundary.bottomN / this._regionBoundary.bottomD )
        }
        const _cols: FractionList = fractionifyList( this._rowOrderY, bottomOffset )
        stats( this._rowOrderY, rationalize( _cols, bottomOffset ) )

        // logFractions("ipldFractionWrites.dat", _rows, _cols, this._regionBoundary)
        const dimensionLayouts: DimensionLayouts = {
          rowsN: paletteMaybe( _rows.N ),
          rowsD: paletteMaybe( _rows.D ),
          colsN: paletteMaybe( _cols.N ),
          colsD: paletteMaybe( _cols.D ),
        }
        const wordSizes: WordSizes = {
          rowsN: dimensionLayouts.rowsN.paletteWordLen,
          rowsD: dimensionLayouts.rowsD.paletteWordLen,
          colsN: dimensionLayouts.colsN.paletteWordLen,
          colsD: dimensionLayouts.colsD.paletteWordLen,
        }
        const chunkHeight: number = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
        const dataBlocks: DataBlock[] = blockify( _rows, _cols, chunkHeight, this._pixelWidth, this._pixelHeight, wordSizes )

        const regionMap: RegionMap = {
          pixelRef: this._pixelRef,
          imageSize: { pixelWidth: this._pixelWidth, pixelHeight: this._pixelHeight },
          projected: this.isProjected(),
          chunkHeight: chunkHeight,
          palettes: dimensionLayouts,
          regionBoundary: this._regionBoundary,
          data: await this.self.commitData( dataBlocks ),
        }
        const rootCid: CID = await this.self.commitRoot( regionMap )
        return rootCid
      }
    }
  }

  private async commitRoot( source: RegionMap ): Promise<CID> {
    // validate and transform
    const value = this.modelEnvelopeSerdes.encodeModel( { "RegionMap_1.0.0": source } )
    if ( value === undefined ) {
      throw new TypeError( "Invalid typed form, does not match schema" )
    }
    const rootBlock = await encode( { codec, hasher, value } )
    const rootCid: CID = rootBlock.cid
    await this.blockStore.put( rootCid, rootBlock.bytes, {} )
    return rootCid
  }

  private async commitData( data: DataBlock[] ): Promise<CID[]> {
    const retVal: CID[] = await Promise.all(
      data.map( async ( dataBlock: DataBlock ) => {
        const value: BlockView<DataBlockRepresentation> =
          await this.dataBlockSerdes.encodeModel( dataBlock )
        if ( value === undefined ) {
          throw new TypeError( "Invalid typed form, does not match schema" )
        }
        const encodedBlock = await encode( { codec, hasher, value } )
        const blockCid: CID = encodedBlock.cid
        await this.blockStore.put( blockCid, encodedBlock.bytes, {} )
        return blockCid
      } ),
    )
    return retVal
  }

  public async load( cid: CID ): Promise<AbstractRegionMap> {
    const rootEncodingBytes: ByteView<ModelEnvelopeRepresentation> =
      await this.blockStore.get( cid )
    // const decodedRootBlock: BlockView<ModelEnvelopeRepresentation > =
    // await decode( { codec, hasher, bytes: rootEncodingBytes } )
    const modelEnvelope: ModelEnvelope =
      await this.modelEnvelopeSerdes.bytesToDomain( rootEncodingBytes )
    if ( modelEnvelope === undefined ) {
      throw new TypeError( "Invalid deserialized representation, did follow from schema" )
    }
    const rootObject: RegionMap = modelEnvelope[ 'RegionMap_1.0.0' ]
    const dataBlocks: DataBlock[] = await Promise.all(
      rootObject.data.map( async ( cidLink: CID ) => {
        const dataEncodingBytes: ByteView<DataBlockRepresentation> =
          await this.blockStore.get( cidLink )
        // const decodedDataBlock: BlockView<DataBlockRepresentation> =
        // await decode( { codec, hasher, bytes: dataEncodingBytes } )
        return this.dataBlockSerdes.bytesToDomain( dataEncodingBytes )
      } ),
    )
    return new IpldRegionMap( rootObject, dataBlocks )
  }

  public async import( director: ( builder: IRegionMapBuilder ) => void ): Promise<CID> {
    const builder = new this.RegionMapModelBuilder( this )
    director( builder )
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
