import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import { Canvas } from "canvas"
import * as fs from "fs"
import { UnixFS } from "ipfs-unixfs"
import { importer, UserImporterOptions } from "ipfs-unixfs-importer"
import { ImportCandidate } from "ipfs-unixfs-importer/types/src/types"
import { CID } from "multiformats"
import * as Block from "multiformats/block"

import { IpfsModule, SharedArtBlockstoresModule, SharedArtBlockstoresModuleTypes } from "../ipfs/di/index.js"
import { CanvasPixelPainter } from "../painting/components/CanvasPixelPainter.js"
import { newPicture } from "../painting/components/genjs6.js"
import { GenModelArtist } from "../painting/components/GenModelArtist.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { PlottingModule, PlottingModuleTypes } from "../plotting/di/index.js"
import { PBufAdapter } from "../plotting/protobuf/PBufAdapter.js"
import { PBufRegionMap } from "../plotting/protobuf/PBufRegionMap.js"
import { PointPlotData, PointPlotDocument, RefPoint } from "../plotting/protobuf/PBufUtil.mjs"

export interface Input {
  path: string
  content: fs.ReadStream
}

@Injectable()
export class AppService {
  constructor (
    @Inject(SharedArtBlockstoreModuleTypes.SharedMapBlockstore)
    private readonly mapBlockstore: BaseBlockstore,
    @Inject(SharedArtBlockstoreModuleTypes.SharedTaskBlockstore)
    private readonly taskBlockstore: BaseBlockstore,
    @Inject(PlottingModuleTypes.IpldRegionMapRepository)
    private readonly repository: IpldRegionMapRepository,
    @Inject(PlottingModuleTypes.ProtoBufAdapterFactory)
    private readonly adapterFactory: PBufAdapterFactory
  ) { }

  public async registerMaps (): Promise<CID> {
    await this.mapBlockstore.open()
    const cid1 = await this.repository.import(
      this.adapterFactory.adapt("plot_maps/hB_320_240.proto")
        .direct(240)
    )
    console.log(`h: ${cid1.toString()}`)
    const cid2 = await this.adapter.import("plot_maps/gB_320_240.proto", 80)
    console.log(`g: ${cid2.toString()}`)
    const cid3 = await this.adapter.import("plot_maps/fB_320_240.proto", 80)
    console.log(`f: ${cid3.toString()}`)
    return cid1
  }

  public async doWork (plotCid: CID): Promise<void> {
    await this.mapBlockstore.open()
    console.log("Map blockstore is open")
    await this.taskBlockstore.open()
    console.log("Task blockstore is open")
    const regionMap = await this.repository.load(plotCid)

    let canvas: Canvas = new Canvas(320, 240)
    const prefix = [...Buffer.from("In the middle")]
    const suffix = [...Buffer.from("37 Bone Coloured Stars")]
    let genModel = newPicture(prefix, suffix)
    let painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./woodoo.png"))
    let plotter1 = new GenModelArtist(genModel, painter1)
    regionMap.drive(plotter1)
    console.log("Plotted woodoo.png")

    canvas = new Canvas(320, 240)
    const prefix2 = [...Buffer.from("Ladies and gentlemen")]
    const suffix2 = [...Buffer.from("we are floating in space")]
    genModel = newPicture(prefix2, suffix2)
    painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./spirit.png"))
    plotter1 = new GenModelArtist(genModel, painter1)
    regionMap.drive(plotter1)
    console.log("Plotted spirit.png")
  }
}

@Module({
  imports: [SharedBlockstoresModule, PlottingModule],
  providers: [AppService],
  exports: []
  })
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
async function bootstrap () {
  const app = await NestFactory.createApplicationContext(AppModule)
  const appSvc = app.get(AppService)
  const cidOne = await appSvc.registerMaps()
  await appSvc.doWork(cidOne)
}

bootstrap().catch((err) => console.log(err))
