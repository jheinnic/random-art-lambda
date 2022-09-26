import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { BaseBlockstore } from "blockstore-core"
import { CID } from "multiformats"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { printIndexBzl } from "../../../../external/build_bazel_rules_nodejs/internal/npm_install/generate_build_file"
import { IpfsModuleTypes } from "../../ipfs/di/typez.js"
import { PlottingModuleTypes } from "../di/typez.js"
import { IRegionMapRepository } from "../interface/IRegionMapRepository.js"
import { IpldRegionMap } from "./IpldRegionMap.js"
import { RegionMapSchemaDsl } from "./IpldRegionMapSchemaDsl.js"
import {
  blockify,
  DataBlock,
  EMPTY_DIMENSION,
  Fractioned,
  fractionify,
  logFractions,
  Numeric,
  paletteMaybe,
  rationalize,
  RegionMap,
  stats,
} from "./IpldSchemaTypes.js"

@Injectable()
export class IpldRegionMapRepository implements IRegionMapRepository {
  constructor (
    @Inject(IpfsModuleTypes.AbstractBlockstore) private readonly blockStore: BaseBlockstore,
    @Inject(PlottingModuleTypes.IpldRegionMapSchemaDsl) private readonly schemaDsl: RegionMapSchemaDsl
  ) { }

  async saveRootModel (source: RegionMap, data: DataBlock[]): Promise<CID> {
    // validate and transform
    source.data = await this.commit(data)
    const sourceData = this.schemaDsl.toRegionMapRepresentation({ RegionMap: source })
    if (sourceData === undefined) {
      throw new TypeError("Invalid typed form, does not match schema")
    }
    const rootBlock = await Block.encode({ codec, hasher, value: sourceData })
    await this.blockStore.put(rootBlock.cid, rootBlock.bytes, {})
    console.log(rootBlock.cid.toString())
    return rootBlock.cid
  }

  async commit (data: DataBlock[]): Promise<CID[]> {
    return await Promise.all(
      data.map(async (dataBlock) => {
        const dataRep = this.schemaDsl.toDataBlockRepresentation(dataBlock)
        if (dataRep === undefined) {
          throw new TypeError("Invalid typed form, does not match schema")
        }
        const encodedBlock = await Block.encode({ codec, hasher, value: dataRep })
        const blockCid: CID = encodedBlock.cid
        await this.blockStore.put(blockCid, encodedBlock.bytes, {})
        console.log(blockCid.toString())
        return blockCid
      })
    )
  }

  async loadData (links: CID[]): Promise<DataBlock[]> {
    return await Promise.all(
      links.map(async (cidLink: CID) => {
        const encodingBytes = await this.blockStore.get(cidLink)
        const decodedBlock = await Block.decode({ codec, hasher, bytes: encodingBytes })
        return this.schemaDsl.toDataBlockTyped(decodedBlock.value)
      })
    )
  }

  public async load (cid: CID): Promise<AbstractRegionMap> {
    const encodingBytes = await this.blockStore.get(cid)
    const decodedBlock = await Block.decode({ codec, hasher, bytes: encodingBytes })
    const rootObject: RegionMap = this.schemaDsl.toRegionMapTyped(decodedBlock.value).RegionMap
    const dataBlocks: DataBlock[] = await this.loadData(rootObject.data)
    return new IpldRegionMap(rootObject, dataBlocks)
  }

  public async import (director: (builder: IRegionMapBuilder) => void, paletteThreshold: number = 256): Promise<CID> {
    const builder: RegionMapBuilder = new RegionMapBuilder(this, paletteThreshold)
    director(builder)
    return await builder.build()
  }
}

class RegionMapBuilder implements IRegionMapBuilder {
  private _pixelRef: "Center" | "TopLeft" = "Center"
  private _chunkHeight: number = -1
  private _pixelWidth: number = -1
  private _pixelHeight: number = -1
  private _regionBoundary: Fractioned<string & keyof RegionBoundary> = { topN: 0, topD: 0, bottomN: 0, bottomD: 0, leftN: 0, leftD: 0, rightN: 0, rightD: 0 }
  private _rowOrderX: number[] = EMPTY_DIMENSION
  private _rowOrderY: number[] = EMPTY_DIMENSION

  constructor (
    private readonly _repository: IpldRegionMapRepository,
    private readonly _paletteThreshold: number = 128
  ) { }

  public pixelRef (pixelRef: "Center" | "TopLeft"): RegionMapBuilder {
    this._pixelRef = pixelRef
    return this
  }

  public imageSize (pixelWidth: number, pixelHeight: number): RegionMapBuilder {
    this._pixelWidth = pixelWidth
    this._pixelHeight = pixelHeight
    return this
  }

  public chunkHeight (chunkHeight: number): RegionMapBuilder {
    this._chunkHeight = chunkHeight
    return this
  }

  public regionBoundary (boundary: Numeric<string & keyof RegionBoundary>): RegionMapBuilder {
    // [ "top", "bottom", "left", "right" ] ),
    this._regionBoundary = fractionify<string & keyof RegionBoundary>(boundary, 0, ["top", "bottom", "left", "right"])
    return this
  }

  public xByRows (rowOrderX: number[]): RegionMapBuilder {
    this._rowOrderX = rowOrderX
    return this
  }

  public yByRows (rowOrderY: number[]): RegionMapBuilder {
    this._rowOrderY = rowOrderY
    return this
  }

  private isProjected (): boolean {
    if ((this._rowOrderX === EMPTY_DIMENSION) || (this._rowOrderY === EMPTY_DIMENSION)) {
      throw new Error("Data points must be defined first")
    }
    if ((this._pixelWidth === -1) || (this.pixelHeight === -1)) {
      throw new Error("Image dimensions must be defined first")
    }
    return (this._rowOrderX.length === this._pixelWidth) && (this._rowOrderY.length === this._pixelHeight)
  }

  private isComplete (): boolean {
    if ((this._rowOrderX === EMPTY_DIMENSION) || (this._rowOrderY === EMPTY_DIMENSION)) {
      throw new Error("Data points must be defined first")
    }
    if ((this._pixelWidth === -1) || (this.pixelHeight === -1)) {
      throw new Error("Image dimensions must be defined first")
    }
    const pixelCount = this._pixelWidth * this._pixelHeight
    return (this._rowOrderX.length === pixelCount) && (this._rowOrderY.length === pixelCount)
  }

  public async build (): Promise<CID> {
    let leftOffset = 0
    if (this._regionBoundary.leftN < 0) {
      leftOffset = (this._regionBoundary.leftN / this._regionBoundary.leftD)
    }
    const _rows = fractionify<"", "">({ "": this._rowOrderX }, leftOffset, [""])
    stats(this._rowOrderX, rationalize(_rows, leftOffset))

    let bottomOffset = 0
    if (this._regionBoundary.bottomN < 0) {
      bottomOffset = (this._regionBoundary.bottomN / this._regionBoundary.bottomD)
    }
    const _cols = fractionify<"", "">({ "": this._rowOrderY }, bottomOffset, [""])
    stats(this._rowOrderY, rationalize(_cols, bottomOffset))

    // logFractions("ipldFractionWrites.dat", _rows, _cols, this._regionBoundary)
    const rowsN = paletteMaybe(_rows.N)
    const rowsD = paletteMaybe(_rows.D)
    const colsN = paletteMaybe(_cols.N)
    const colsD = paletteMaybe(_cols.D)
    const wordSizes: Fractioned<"row" | "col"> = {
      rowN: rowsN.paletteWordLen,
      rowD: rowsD.paletteWordLen,
      colN: colsN.paletteWordLen,
      colD: colsD.paletteWordLen
    }
    const chunkHeight = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
    const dataBlocks = blockify(_rows, _cols, chunkHeight, this._pixelWidth, this._pixelHeight, wordSizes)
    const source = {
      pixelRef: this._pixelRef,
      imageSize: { pixelWidth: this._pixelWidth, pixelHeight: this._pixelHeight },
      regionBoundary: this._regionBoundary,
      projected: this.isProjected(),
      chunkHeight,
      rowsN,
      rowsD,
      colsN,
      colsD
    }
    return await this._repository.saveRootModel(source, dataBlocks)
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
