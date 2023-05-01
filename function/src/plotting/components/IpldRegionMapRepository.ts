import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID } from "multiformats"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import { Optional } from "simplytyped"

import { PlottingModuleTypes } from "../di/index.js"
import { IRegionMapBuilder } from "../interface/IRegionMapBuilder.js"
import { IRegionMapRepository } from "../interface/IRegionMapRepository.js"
import { ISchemaSerdes } from "../ipfs/interface/ISchemaSerdes.js"
import {
  DataBlock,
  EMPTY_DIMENSION,
  FractionList,
  RegionBoundaries,
  RegionBoundaryFractions,
  RegionMap,
  WordSizes,
} from "../interface/RegionMapSchemaTypes.js"
import { AbstractRegionMap } from "./AbstractRegionMap.js"
import { IpldRegionMap } from "./IpldRegionMap.js"
import { blockify, fractionifyBounds, fractionifyList, paletteMaybe, rationalize, stats } from "./RegionMapUtils.js"


function isCoarse( boundary: RegionBoundaries | RegionBoundaryFractions ): boundary is RegionBoundaries {
  return Object.keys( boundary ).includes( "top" )
}

@Injectable()
export class IpldRegionMapRepository implements IRegionMapRepository {
  constructor (
    @Inject( PlottingModuleTypes.InjectedBlockStore ) private readonly blockStore: Blockstore,
    @Inject( PlottingModuleTypes.IRegionMapSchemaDsl ) private readonly schemaSerdes: ISchemaSerdes,
  ) {
    console.log( blockStore.constructor.name )
  }

  private RegionMapModelBuilder = class implements IRegionMapBuilder {
    private _pixelRef: "Center" | "TopLeft" = "Center"
    private _chunkHeight: number = -1
    private _pixelWidth: number = -1
    private _pixelHeight: number = -1
    private _regionBoundary: RegionBoundaryFractions = { topN: 0, topD: 0, bottomN: 0, bottomD: 0, leftN: 0, leftD: 0, rightN: 0, rightD: 0 }
    private _rowOrderX: number[] = EMPTY_DIMENSION
    private _rowOrderY: number[] = EMPTY_DIMENSION

    constructor ( private self: IpldRegionMapRepository ) { }

    public pixelRef( pixelRef: "Center" | "TopLeft" ): RegionMapBuilder {
      this._pixelRef = pixelRef
      return this
    }

    public imageSize( pixelWidth: number, pixelHeight: number ): RegionMapBuilder {
      this._pixelWidth = pixelWidth
      this._pixelHeight = pixelHeight
      return this
    }

    public chunkHeight( chunkHeight: number ): RegionMapBuilder {
      this._chunkHeight = chunkHeight
      return this
    }

    public regionBoundary( boundary: RegionBoundaries ): RegionMapBuilder
    public regionBoundary( boundary: RegionBoundaryFractions ): RegionMapBuilder
    public regionBoundary( boundary: RegionBoundaries | RegionBoundaryFractions ): RegionMapBuilder {
      if ( isCoarse( boundary ) ) {
        this._regionBoundary = fractionifyBounds( boundary )
      } else {
        this._regionBoundary = { ...boundary }
      }
      return this
    }

    public xByRows( rowOrderX: number[] ): RegionMapBuilder {
      this._rowOrderX = rowOrderX
      return this
    }

    public yByRows( rowOrderY: number[] ): RegionMapBuilder {
      this._rowOrderY = rowOrderY
      return this
    }

    private isInterpolated(): boolean {
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
        rowsN: this._dimensionLayouts._rowsN.paletteWordLen,
        rowsD: this._dimensionLayouts._rowsD.paletteWordLen,
        colsN: this._dimensionLayouts._colsN.paletteWordLen,
        colsD: this._dimensionLayouts._colsD.paletteWordLen,
      }
      const chunkHeight: number = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
      const dataBlocks: DataBlock[] = blockify( _rows, _cols, chunkHeight, this._pixelWidth, this._pixelHeight, wordSizes )

      const regionMap: RegionMap = {
        pixelRef: this._pixelRef,
        imageSize: { pixelWidth: this._pixelWidth, pixelHeight: this._pixelHeight },
        interpolated: this.isInterpolated(),
        chunkHeight: chunkHeight,
        dimensionLayouts: dimensionLayouts,
        regionBoundary: regionBoundary,
        dataBlocks: await this.self.commitData( dataBlocks ),
      }
      const rootCid: CID = await this.commitRoot( rootBlock )
      return rootCid
    }
  }

  private async commitRoot( source: RegionMap ): Promise<CID> {
    // validate and transform
    const value = this.schemaDsl.toRegionMapRepresentation( source )
    if ( value === undefined ) {
      throw new TypeError( "Invalid typed form, does not match schema" )
    }
    const rootBlock = await Block.encode( { codec, hasher, value } )
    const rootCid: CID = rootBlock.cid
    await this.blockStore.put( rootCid, rootBlock.bytes, {} )
    return rootCid
  }

  private async commitData( data: DataBlock[] ): Promise<CID[]> {
    const retVal: CID[] = await Promise.all(
      data.map( async ( dataBlock ) => {
        const value = this.schemaDsl.( dataBlock )
        if ( value === undefined ) {
          throw new TypeError( "Invalid typed form, does not match schema" )
        }
        const encodedBlock = await Block.encode( { codec, hasher, value } )
        const blockCid: CID = encodedBlock.cid
        await this.blockStore.put( blockCid, encodedBlock.bytes, {} )
        return blockCid
      } ),
    )
    return retVal
  }

  public async load( cid: CID ): Promise<AbstractRegionMap> {
    const rootEncodingBytes = await this.blockStore.get( cid )
    const decodedRootBlock =
      await Block.decode( { codec, hasher, bytes: rootEncodingBytes } )
    const rootObject: RegionMap =
      this.schemaDsl.toRegionMapTyped( decodedRootBlock.value )
    const dataBlocks: DataBlock[] = await Promise.all(
      rootObject.data.map( async ( cidLink: CID ) => {
        const dataEncodingBytes = await this.blockStore.get( cidLink )
        const decodedDataBlock =
          await Block.decode( { codec, hasher, bytes: dataEncodingBytes } )
        return this.schemaDsl.toDataBlockTyped( decodedDataBlock.value )
      } ),
    )
    return new IpldRegionMap( rootObject, dataBlocks )
  }

  public async import( director: ( builder: IRegionMapBuilder ) => void ): Promise<CID> {
    const builder: RegionMapBuilder = new RegionMapBuilder( this )
    director( builder )
    const rootCid = await builder.commit()
    return rootCid
  }
}

class RegionMapBuilder implements IRegionMapBuilder {
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
