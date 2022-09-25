import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { BitOutputStream } from "@thi.ng/bitstream"
import { BaseBlockstore } from "blockstore-core"
import * as fs from "fs"
import * as math from "mathjs"
import { CID } from "multiformats"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { IpfsModuleTypes } from "../../ipfs/di/typez.js"
import { PlottingModuleTypes } from "../di/typez.js"
import { IRegionMapRepository } from "../interface/IRegionMapRepository.js"
import { IpldRegionMap } from "./IpldRegionMap.js"
import { RegionMapSchemaDsl } from "./IpldRegionMapSchemaDsl.js"
import { DataBlock, NO_BYTES, RegionMap } from "./IpldSchemaTypes.js"

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
  private _rows: Fractions = { N: [], D: [] }
  private _cols: Fractions = { N: [], D: [] }

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
    this._regionBoundary = fractionify<string & keyof RegionBoundary>(boundary, ["top", "bottom", "left", "right"])
    return this
  }

  public xByRows (rowOrderX: number[]): RegionMapBuilder {
    // { rowsN: this._rowsN, rowsD: this._rowsD } = fractionify( { rows: rowOrderX } , "rows")
    this._rows = fractionify<"", "">({ "": rowOrderX }, [""])
    // const undo = rationalize(this._rows)
    // stats(rowOrderX, undo)
    return this
  }

  public yByRows (rowOrderY: number[]): RegionMapBuilder {
    this._cols = fractionify <"", "">({ "": rowOrderY }, [""])
    // const undo = rationalize(this._cols)
    // stats(colOrderY, undo)
    return this
  }

  private isProjected (): boolean {
    return (this._rows.N.length === this._pixelWidth) && (this._cols.N.length === this._pixelHeight)
  }

  public async build (): Promise<CID> {
    const chunkHeight = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
    const [rowsNPalette, rowsNPaletteWordLen, rowsNBaseWordLen] = paletteMaybe(this._rows.N)
    const [rowsDPalette, rowsDPaletteWordLen, rowsDBaseWordLen] = paletteMaybe(this._rows.D)
    const [colsNPalette, colsNPaletteWordLen, colsNBaseWordLen] = paletteMaybe(this._cols.N)
    const [colsDPalette, colsDPaletteWordLen, colsDBaseWordLen] = paletteMaybe(this._cols.D)
    const wordSizes: Fractioned<"row" | "col"> = {
      rowN: rowsNPalette.length > 0 ? rowsNPaletteWordLen : rowsNBaseWordLen,
      rowD: rowsDPalette.length > 0 ? rowsDPaletteWordLen : rowsDBaseWordLen,
      colN: colsNPalette.length > 0 ? colsNPaletteWordLen : colsNBaseWordLen,
      colD: colsDPalette.length > 0 ? colsDPaletteWordLen : colsDBaseWordLen
    }
    const dataBlocks = blockify(this._rows, this._cols, chunkHeight, this._pixelWidth, this._pixelHeight, wordSizes)
    const source = {
      pixelRef: this._pixelRef,
      imageSize: { pixelWidth: this._pixelWidth, pixelHeight: this._pixelHeight },
      regionBoundary: this._regionBoundary,
      projected: this.isProjected(),
      rowsN: { palette: rowsNPalette, paletteWordLen: rowsNPaletteWordLen, baseWordLen: rowsNBaseWordLen },
      rowsD: { palette: rowsDPalette, paletteWordLen: rowsDPaletteWordLen, baseWordLen: rowsDBaseWordLen },
      colsN: { palette: colsNPalette, paletteWordLen: colsNPaletteWordLen, baseWordLen: colsNBaseWordLen },
      colsD: { palette: colsDPalette, paletteWordLen: colsDPaletteWordLen, baseWordLen: colsDBaseWordLen },
      chunkHeight
    }
    return await this._repository.saveRootModel(source, dataBlocks)
  }
}

function fractionify<K extends string = string, A extends K = never> (source: Numeric<K, A>, fields: K[]): Fractioned<K, A> {
  const retVal: Fractioned<K, A> = {} as any as Fractioned<K, A>
  let k: K
  for (k of fields) {
    const src = source[k]
    if (src instanceof Array) {
      const fractions = src.map(
        (x) => math.fraction(x))
      retVal[`${k}N`] = fractions.map((x) => x.n * x.s)
      retVal[`${k}D`] = fractions.map((x) => x.d)
    } else {
      const frac = math.fraction(src)
      retVal[`${k}N`] = frac.n * frac.s
      retVal[`${k}D`] = frac.d
    }
  }
  return retVal
}

function paletteMaybe (src: number[]): [Palette, number, number] {
  const asSet = new Set(src)
  const paletteWordLen = Math.ceil(Math.log2(asSet.size))
  const srcMax = src.reduce((acc, value) => Math.max(acc, value), 0)
  const srcMin = src.reduce((acc, value) => Math.min(acc, value), 0)
  const baseWordLen = Math.ceil(Math.log2(Math.max(srcMax, -1 * srcMin)))
  const newSize = (src.length * paletteWordLen) + (asSet.size * baseWordLen)
  const baseSize = (src.length * baseWordLen)
  console.log(`${newSize} >?< ${baseSize}, ${paletteWordLen}, ${asSet.size}, ${baseWordLen}, ${src.length} :: ${srcMin} to ${srcMax}`)
  if (newSize > baseSize) {
    return [NO_BYTES, baseWordLen, baseWordLen]
  }
  const palette: Palette = [...asSet]
  const map: Map<number, number> = new Map<number, number>()
  palette.forEach(
    (value: number, idx: number) => { map.set(value, idx) })
  src.forEach(
    (value: number, idx: number) => { src[idx] = map.get(value) ?? -1 })
  return [translate(palette, baseWordLen), paletteWordLen, baseWordLen]
}

function blockify (
  rows: Fractions, cols: Fractions, chunkHeight: number,
  pixelWidth: number, pixelHeight: number, wordSizes: Fractioned<"row" | "col">
): DataBlock[] {
  const chunkCount = Math.ceil(1.0 * pixelHeight / chunkHeight)
  const chunkSize = chunkHeight * pixelWidth
  const blocks = new Array<DataBlock>(chunkCount)
  let currentOffset = 0
  let idx = 0
  for (idx = 0; idx < chunkCount; idx++) {
    const nextOffset = currentOffset + chunkSize
    blocks[idx] = {
      height: idx * chunkHeight,
      rowsN: translate(rows.N.slice(currentOffset, nextOffset), wordSizes.rowN),
      rowsD: translate(rows.D.slice(currentOffset, nextOffset), wordSizes.rowD),
      colsN: translate(cols.N.slice(currentOffset, nextOffset), wordSizes.colN),
      colsD: translate(cols.D.slice(currentOffset, nextOffset), wordSizes.colD)
    }
    currentOffset = nextOffset
  }
  return blocks
}

function translate (input?: number[], wordSize: number = 52): Uint8Array {
  if (input === undefined) {
    return Uint8Array.of()
  } else {
    const writer = new BitOutputStream()
    writer.writeWords(input, wordSize)
    // console.log(bytes.length, input.length, input.length * 6.5)
    return writer.bytes()
  }
}
