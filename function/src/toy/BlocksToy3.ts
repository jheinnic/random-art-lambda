import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import { Canvas } from "canvas"
import * as fs from "fs"
import { CID } from "multiformats"
import * as Block from "multiformats/block"

import { IpfsModule } from "../ipfs/di/IpfsModule.js"
import { IpfsModuleTypes } from "../ipfs/di/typez.js"
import { CanvasPixelPainter } from "../painting/components/CanvasPixelPainter.js"
import pkg from "../painting/components/genjs6.cjs"
import { GenModelPlotter } from "../painting/components/GenModelPlotter.js"
import { IRegionPlotter } from "../painting/interface/IRegionPlotter.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { PlottingModule } from "../plotting/di/PlottingModule.js"
import { PlottingModuleTypes } from "../plotting/di/typez.js"
import { PBufRegionMapDecoder } from "../plotting/protobuf/PBufRegionMapDecoder.js"
import { PointPlotData, PointPlotDocument, RefPoint } from "../plotting/protobuf/plot_mapping_pb.mjs"
import { ProtobufAdapter } from "../plotting/protobuf/ProtobufAdapter.js"

// import { GenModel, newPicture } from "../painting/components/genjs6.js"
const { newPicture, computePixel } = pkg

/*
// a schema for a terse data format
const schemaDsl = `type ModelEnvelope union {
  | RegionMap "RegionMap_1.0.0"
} representation envelope {
  discriminantKey "version"
  contentKey "model"
}

type RegionMap struct {
  pixelRef RefPoint
  imageSize ImageSize
  chunkHeight Int
  regionBoundary RegionBoundary
  projected Bool
  rowsNPalette Bytes
  rowsDPalette Bytes
  colsNPalette Bytes
  colsDPalette Bytes
  data [&DataBlock]
} representation tuple

type RegionBoundary struct {
  topN Int
  topD Int
  bottomN Int
  bottomD Int
  leftN Int
  leftD Int
  rightN Int
  rightD Int
} representation tuple

type ImageSize struct {
  pixelHeight Int
  pixelWidth Int
} representation tuple

type RefPoint enum {
  | Center     ("1")
  | TopLeft    ("2")
} representation int

type DataBlock struct {
  height Int
  rowsN Bytes
  rowsD Bytes
  colsN Bytes
  colsD Bytes
} representation tuple
`

// parse schema
const schemaDmt = fromDSL(schemaDsl)

// create a typed converter/validator
const rootTyped = create(schemaDmt, "ModelEnvelope")
const dataTyped = create(schemaDmt, "DataBlock")

// const modelBuf = fs.readFileSync("./fdoc.proto")
// const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
// const plotData = plotDocument.getData()
// if (plotData === undefined || plotData === null) {
// throw new Error("Plot Data subunit must be defined!")
// }

export interface PixelSize {
  pixelWidth: number
  pixelHeight: number
}

export interface RegionBoundary {
  top: number
  bottom: number
  left: number
  right: number
}

// export type Palette = Bytes

export interface DataBlock {
  height: Int
  rowsN: Uint8Array
  rowsD: Uint8Array
  colsN: Uint8Array
  colsD: Uint8Array
}

export interface RegionMap {
  pixelRef: "Center" | "TopLeft"
  imageSize: PixelSize
  chunkHeight: Int
  regionBoundary: Fractioned<RegionBounds>
  projected: boolean
  rowNPalette?: Uint8Array
  rowDPalette?: Uint8Array
  colNPalette?: Uint8Array
  colDPalette?: Uint8Array
  data: CID[]
}

export interface IModelBuilder {
  pixelRef: (pixelRef: "Center" | "TopLeft") => IModelBuilder
  imageSize: (width: number, height: number) => IModelBuilder
  chunkHeight: (height: number) => IModelBuilder
  regionBoundary: (boundary: Numeric<RegionBounds>) => IModelBuilder
  xByRow: (rowOrderX: number[]) => IModelBuilder
  yByCol: (colOrderY: number[]) => IModelBuilder
}

class ModelBuilder implements IModelBuilder {
  private _pixelRef: "Center" | "TopLeft" = "Center"
  private _chunkHeight: number = -1
  private _pixelWidth: number = -1
  private _pixelHeight: number = -1
  private _regionBoundary: Fractioned<RegionBounds> = { topN: 0, topD: 0, bottomN: 0, bottomD: 0, leftN: 0, leftD: 0, rightN: 0, rightD: 0 }
  private _rows: { n: number[], d: number[] } = { n: [], d: [] }
  private _cols: { n: number[], d: number[] } = { n: [], d: [] }

  constructor (private readonly _repository: RegionModelRepository, private readonly _paletteThreshold: number = 128) {
  }

  public pixelRef (pixelRef: "Center" | "TopLeft"): ModelBuilder {
    this._pixelRef = pixelRef
    return this
  }

  public imageSize (pixelWidth: number, pixelHeight: number): ModelBuilder {
    this._pixelWidth = pixelWidth
    this._pixelHeight = pixelHeight
    return this
  }

  public chunkHeight (chunkHeight: number): ModelBuilder {
    this._chunkHeight = chunkHeight
    return this
  }

  public regionBoundary (boundary: Numeric<RegionBounds>): ModelBuilder {
    // [ "top", "bottom", "left", "right" ] ),
    this._regionBoundary = fractionify<RegionBounds>(boundary, ["top", "bottom", "left", "right"])
    return this
  }

  public xByRows (rowOrderX: number[]): ModelBuilder {
    // { rowsN: this._rowsN, rowsD: this._rowsD } = fractionify( { rows: rowOrderX } , "rows")
    const { rowsN, rowsD } = fractionify<"rows", "rows">({ rows: rowOrderX }, ["rows"])
    this._rows = { n: rowsN, d: rowsD }
    const undo = rationalize(this._rows)
    stats(rowOrderX, undo)
    return this
  }

  public yByRows (rowOrderY: number[]): ModelBuilder {
    // { colsN: this.colsN, colsD: this.colsD } = fractionify( { cols: colOrderY }, "cols")
    const { colsN, colsD } = fractionify <"cols", "cols">({ cols: rowOrderY }, ["cols"])
    this._cols = { n: colsN, d: colsD }
    const undo = rationalize(this._cols)
    stats(rowOrderY, undo)
    return this
  }

  private isProjected (): boolean {
    return (this._rows.n.length === this._pixelWidth) && (this._cols.n.length === this._pixelHeight)
  }

  public async build (): Promise<string> {
    const chunkHeight = this._chunkHeight > -1 ? this._chunkHeight : this._pixelHeight
    const rowsNPalette = translate(paletteMaybe(this._rows.n, this._paletteThreshold))
    const rowsDPalette = translate(paletteMaybe(this._rows.d, this._paletteThreshold))
    const colsNPalette = translate(paletteMaybe(this._cols.n, this._paletteThreshold))
    const colsDPalette = translate(paletteMaybe(this._cols.d, this._paletteThreshold))
    const dataBlocks = blockify(this._rows, this._cols, chunkHeight, this._pixelWidth, this._pixelHeight)

    const source = {
      pixelRef: this._pixelRef,
      imageSize: { pixelWidth: this._pixelWidth, pixelHeight: this._pixelHeight },
      chunkHeight,
      regionBoundary: this._regionBoundary,
      projected: this.isProjected(),
      rowsNPalette,
      rowsDPalette,
      colsNPalette,
      colsDPalette,
      data: await this._repository.commit(dataBlocks)
    }
    return await this._repository.saveRootModel(source)
  }
}

type NorD = "N" | "D"

type RegionBounds = "top" | "bottom" | "left" | "right"
type Numeric<K extends string = string, A extends K = never> = { [P in K]: P extends A ? number[] : number }

interface Fractions { n: number[], d: number[] }
type Fractioned<K extends string = string, A extends K = never> =
  { [ P in K as `${P}${NorD}` ]: P extends A ? number[] : number }

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

function rationalize (fractions: Fractions): number[] {
  const len = fractions.n.length
  const retval = new Array<number>(len)
  let idx = 0
  for (idx = 0; idx < len; idx++) {
    const frac = math.fraction(fractions.n[idx], fractions.d[idx])
    retval[idx] = math.number(frac)
  }
  return retval
}

function stats (before: number[], after: number[]): void {
  const len = before.length
  let maxOver = -999
  let maxUnder = 999
  let minOver = 999
  let minUnder = -999
  let sumOver = 0
  let sumUnder = 0
  let nOver = 0
  let nUnder = 0
  let nExact = 0
  let idx = 0
  for (idx = 0; idx < len; idx++) {
    const delta = after[idx] - before[idx]
    if (delta > 0) {
      if (delta > maxOver) {
        maxOver = delta
      }
      if (delta < minOver) {
        minOver = delta
      }
      sumOver = sumOver + delta
      nOver = nOver + 1
    } else if (delta < 0) {
      if (delta < maxUnder) {
        maxUnder = delta
      }
      if (delta > minUnder) {
        minUnder = delta
      }
      sumUnder = sumUnder + delta
      nUnder = nUnder + 1
    } else {
      nExact = nExact + 1
    }
  }

  const avgOver = sumOver / nOver
  const avgUnder = sumUnder / nUnder
  console.log(`Under :: Min=${minUnder}, Max=${maxUnder}, Count=${nUnder}, Avg=${avgUnder}`)
  console.log(`Over :: Min=${minOver}, Max=${maxOver}, Count=${nOver}, Avg=${avgOver}`)
  console.log(`Exact :: Count=${nExact}`)
}

function paletteMaybe (src: number[], threshold: number): Palette | undefined {
  const asSet = new Set(src)
  if (asSet.size > threshold) {
    return undefined
  }
  const palette: Palette = [...asSet]
  const map: Map<number, number> = new Map<number, number>()
  palette.forEach(
    (value: number, idx: number) => { map.set(value, idx) })
  src.forEach(
    (value: number, idx: number) => { src[idx] = map.get(value) ?? -1 })
  return palette
}

function blockify (rows: Fractions, cols: Fractions, chunkHeight: number, pixelWidth: number, pixelHeight: number): DataBlock[] {
  const chunkCount = Math.ceil(1.0 * pixelHeight / chunkHeight)
  const chunkSize = chunkHeight * pixelWidth
  let idx = 0
  const blocks = new Array<DataBlock>(chunkCount)
  for (idx = 0; idx < chunkCount; idx++) {
    const currentOffset = idx * chunkSize
    blocks[idx] = {
      height: idx * chunkHeight,
      rowsN: translate(rows.n.slice(currentOffset, currentOffset + chunkSize)),
      rowsD: translate(rows.d.slice(currentOffset, currentOffset + chunkSize)),
      colsN: translate(cols.n.slice(currentOffset, currentOffset + chunkSize)),
      colsD: translate(cols.d.slice(currentOffset, currentOffset + chunkSize))
    }
  }
  return blocks
}

function translate (input?: number[]): Uint8Array {
  if (input === undefined) {
    return Uint8Array.of()
  } else {
    const foo = new BitOutputStream()
    foo.writeWords(input, 52)
    const bytes = foo.bytes()
    console.log(bytes.length, input.length, input.length * 6.5)
    return Uint8Array.from(bytes)
  }
}

@Injectable()
export class RegionModelRepository {
  constructor (@Inject(IpfsModuleTypes.AbstractBlockstore) private readonly blockStore: BaseBlockstore) { }

  public async saveRootModel (source: RegionMap): Promise<CID> {
    // validate and transform
    const sourceData = rootTyped.toRepresentation({ RegionMap: source })
    if (sourceData === undefined) {
      throw new TypeError("Invalid typed form, does not match schema")
    }

    // what do we have?
    console.log("Representation form:", sourceData)
    console.dir(sourceData, { depth: Infinity })

    // validate and transform back into representation form
    // what do we have?
    // console.log("Modified representation data:", JSON.stringify(newData))
    const rootBlock = await Block.encode({ codec, hasher, value: sourceData })
    console.log("Root block, encoded")
    console.dir(rootBlock, { depth: Infinity })
    await this.blockStore.put(rootBlock.cid, rootBlock.bytes, {})

    const blockObject = await Block.decode({ codec, hasher, bytes: rootBlock.bytes })
    console.log("Root block, decoded")
    console.dir(blockObject, { depth: Infinity })
    const rootTwo = rootTyped.toTyped(blockObject.value)
    console.dir(rootTwo, { depth: Infinity })

    return rootBlock.cid
  }

  public async commit (data: DataBlock[]): Promise<CID[]> {
    return await Promise.all(
      data.map(async (source) => {
        const sourceData = dataTyped.toRepresentation(source)
        if (sourceData === undefined) {
          throw new TypeError("Invalid typed form, does not match schema")
        }

        // what do we have?
        console.log("Representation form:", sourceData)
        console.dir(sourceData, { depth: Infinity })

        // validate and transform back into representation form
        // what do we have?
        // console.log("Modified representation data:", JSON.stringify(newData))
        const dataBlock = await Block.encode({
          codec, hasher, value: sourceData
        })
        console.log("Data block, encoded")
        console.dir(dataBlock, { depth: Infinity })
        await this.blockStore.put(dataBlock.cid, dataBlock.bytes, {})

        return dataBlock.cid
      })
    )
  }

  async import (director: (builder: IModelBuilder) => void, paletteThreshold): Promise<CID> {
    const builder: ModelBuilder = new ModelBuilder(this, paletteThreshold)
    director(builder)
    return await builder.build()
  }
}

@Injectable()
export class ProtobufAdapter {
  private readonly paletteThreshold: number

  constructor (
    @Inject(RegionModelRepository) private readonly repository: RegionModelRepository
  ) {
    this.paletteThreshold = 256
  }

  async transfer (source: PointPlotData, chunkHeight: number): Promise<CID> {
    return await this.repository.import(
      (builder: IModelBuilder) => {
        builder.pixelRef(source.getPixelref() === RefPoint.CENTER ? "Center" : "TopLeft")
          .chunkHeight(chunkHeight)
          .imageSize(source.getResolution().getPixelwidth(), source.getResolution().getPixelheight())
          .regionBoundary(source.getMappedRegion().toObject())
          .xByRow(source.getRowsList())
          .yByCol(source.getColumnsList())
      },
      this._paletteThreshold
    )
  }
}

// function adaptDimension (input?: number): { Dimension: { n: AsyncGenerator, d: AsyncGenerator } } {
//   if (input === undefined) {
//     throw new Error("Input dimension must be defined")
//   }
//   const fractions = input.map((x) => math.fraction(x))
//   const nArr = fractions.map((x) => x.n)
//   const dArr = fractions.map((x) => x.d)
//   console.dir(nArr, { depth: Infinity })
//   console.dir(dArr, { depth: Infinity })
//   const nSet = new Set(nArr)
//   const dSet = new Set(dArr)
//   console.log(`nSet has ${nSet.size} members, dSet has ${dSet.size} members`)
//   return {
//     // n: fbl.from(prepare(nArr), { algorithm: fbl.balanced() }),
//     n: translate(nArr),
//     // d: fbl.from(prepare(dArr), { algorithm: fbl.balanced() })
//     d: translate(dArr)
//   }
// }

// async function * prepare (input?: number[]): AsyncIterable<Buffer> {
//   yield Buffer.from(translate(input))
// }
*/

class LoggingPlotter implements IRegionPlotter {
  private readonly messages: string[] = []
  private readonly index: number = 1

  constructor (
    private readonly streamOut: WritableStream
  ) { }

  public plot (pixelX: number, pixelY: number, regionX: number, regionY: number): void {
    this.messages.push(`${this.index++} ::\n\t(${pixelX}, ${pixelY}) => (${regionX}, ${regionY})`)
    if ((this.index % 16384) === 1) {
      this.streamOut.write(
        Buffer.from(
          this.messages.splice(0).join("\n")
        )
      )
    }
  }

  public finish (): void {
    return this.streamOut.write(
      Buffer.from(
        this.messages.splice(0).join("\n")
      )
    )
  }
}

@Injectable()
export class AppService {
  constructor (
    @Inject(IpfsModuleTypes.AbstractBlockstore)
    private readonly fsBlockstore: BaseBlockstore,
    @Inject(PlottingModuleTypes.IpldRegionMapRepository)
    private readonly repository: IpldRegionMapRepository,
    @Inject(PlottingModuleTypes.ProtoBufAdapter)
    private readonly adapter: ProtobufAdapter
  ) { }

  public async doWork (): Promise<void> {
    console.log(this.fsBlockstore)
    await this.fsBlockstore.open()
    console.log("Blockstore is open")
    const modelBuf = fs.readFileSync("fdoc.proto")
    const dec = new PBufRegionMapDecoder()
    let pbRegionMap
    dec.provide(modelBuf).then((x) => { pbRegionMap = x }).catch(console.error)

    const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
    const plotData = plotDocument.getData()
    if (plotData === undefined) {
      console.error("Not Plot Data!")
      throw new Error()
    }
    const plotCid: CID = await this.adapter.transfer(plotData, 64)
    console.log(plotCid)
    const regionMap = await this.repository.load(plotCid)
    const prefix = [...Buffer.from("Dos")]
    // const prefix = [...Buffer.from("This")]
    // const prefix = [...Buffer.from("In the middle")]
    const suffix = [...Buffer.from("37 Bone Coloured Stars")]
    // const suffix = [...Buffer.from("place")]
    // const suffix = [...Buffer.from("of everything we saw")]
    let genModel = newPicture(prefix, suffix)
    let canvas: Canvas = new Canvas(1024, 1024)
    let painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./saloon1.png"))
    let painter2 = new CanvasPixelPainter(canvas, fs.createWriteStream("./saloon2.png"))
    let plotter1 = new GenModelPlotter(genModel, painter1)
    let plotter2 = new GenModelPlotter(genModel, painter2)

    console.log("Starting first plot!")
    pbRegionMap.drive(plotter2)
    console.log("Plotted saloon2.png")
    regionMap.drive(plotter1)
    console.log("Plotted saloon1.png")
    const prefix2 = [...Buffer.from("m")]
    genModel = newPicture(prefix2, suffix)
    painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./spoon1.png"))
    painter2 = new CanvasPixelPainter(canvas, fs.createWriteStream("./spoon2.png"))
    plotter1 = new GenModelPlotter(genModel, painter1)
    plotter2 = new GenModelPlotter(genModel, painter2)
    pbRegionMap.drive(plotter2)
    console.log("Plotted spoon2.png")
    regionMap.drive(plotter1)
    console.log("Plotted spoon1.png")
    console.log("Finished!")
  }
}

@Module({
  imports: [
  // IpfsModule.register(
// { rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: IpfsModuleTypes.AbstractBlockstore}
  // ),
  PlottingModule
  ],
  providers: [AppService, ProtobufAdapter],
  exports: []
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function bootstrap () {
  const app = await NestFactory.createApplicationContext(AppModule)
  const appSvc = app.get(AppService)
  await appSvc.doWork()
}

bootstrap().catch((err) => console.log(err))
