import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import { Canvas } from "canvas"
import * as fs from "fs"
import { CID } from "multiformats"
import * as Block from "multiformats/block"

import { IpfsModule } from "../ipfs/di/IpfsModule.js"
import { SharedArtBlockstoreModule } from "../ipfs/di/SharedArtBlockstoreModule.js"
import { SharedArtBlockstoreModuleTypes } from "../ipfs/di/typez.js"
import { CanvasPixelPainter } from "../painting/components/CanvasPixelPainter.js"
import { newPicture } from "../painting/components/genjs6.js"
import { GenModelPlotter } from "../painting/components/GenModelPlotter.js"
import { IRegionPlotter } from "../painting/interface/IRegionPlotter.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { PlottingModule } from "../plotting/di/PlottingModule.js"
import { PlottingModuleTypes } from "../plotting/di/typez.js"
import { PBufAdapter } from "../plotting/protobuf/PBufAdapter.js"
import { PBufRegionMap } from "../plotting/protobuf/PBufRegionMap.js"
import { PointPlotData, PointPlotDocument, RefPoint } from "../plotting/protobuf/plot_mapping_epb.mjs"

@Injectable()
export class AppService {
  constructor (
    @Inject(SharedArtBlockstoreModuleTypes.SharedMapBlockstore)
    private readonly mapBlockstore: BaseBlockstore,
    @Inject(SharedArtBlockstoreModuleTypes.SharedTaskBlockstore)
    private readonly taskBlockstore: BaseBlockstore,
    @Inject(PlottingModuleTypes.IpldRegionMapRepository)
    private readonly repository: IpldRegionMapRepository,
    @Inject(PlottingModuleTypes.ProtoBufAdapter)
    private readonly adapter: PBufAdapter
  ) { }

  public async registerMaps (): Promise<CID> {
    await this.mapBlockstore.open()
    const cid1 = await this.adapter.import("plot_maps/h_320_240.proto", 30)
    console.log(`h: ${cid1.toString()}`)
    const cid2 = await this.adapter.import("plot_maps/g_320_240.proto", 60)
    console.log(`g: ${cid2.toString()}`)
    const cid3 = await this.adapter.import("plot_maps/f_320_240.proto", 80)
    console.log(`f: ${cid3.toString()}`)
    return cid1
  }

  public async doWork (plotCid: CID): Promise<void> {
    await this.mapBlockstore.open()
    console.log("Map blockstore is open")
    await this.taskBlockstore.open()
    console.log("Task blockstore is open")
    const regionMap = await this.repository.load(plotCid)
    const prefix = [...Buffer.from("mv8f5f85676\":KP}567r8ft89tyfjfgrf>{ygfrtg-%#8rgf5f85676\":KPh5KR^kf76hfrghtfjuyhjufyfhyufiujffyu87fyh5f9kvv08ypop")]
    // const prefix = [...Buffer.from("MAGICration")]
    // const prefix = [...Buffer.from("Dos")]
    // const prefix = [...Buffer.from("This")]
    // const prefix = [...Buffer.from("In the middle")]
    const suffix = [...Buffer.from("dothis")]
    // const suffix = [...Buffer.from("37 Bone Coloured Stars")]
    // const suffix = [...Buffer.from("place")]
    // const suffix = [...Buffer.from("of everything we saw")]
    let genModel = newPicture(prefix, suffix)
    let canvas: Canvas = new Canvas(320, 240)
    let painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./woodoo.png"))
    // let painter2 = new CanvasPixelPainter(canvas, fs.createWriteStream("./falcon2.png"))
    let plotter1 = new GenModelPlotter(genModel, painter1)
    // let plotter2 = new GenModelPlotter(genModel, painter2)

    console.log("Starting first plot!")
    // pbRegionMap.drive(plotter2)
    // console.log("Plotted faloon2.png")
    regionMap.drive(plotter1)
    console.log("Plotted woodoo.png")
    canvas = new Canvas(320, 240)
    const prefix2 = [...Buffer.from("Ladies and gentlemen")]
    const suffix2 = [...Buffer.from("we are floating in space")]
    genModel = newPicture(prefix2, suffix2)
    painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./spirit.png"))
    // painter2 = new CanvasPixelPainter(canvas, fs.createWriteStream("./manon2.png"))
    plotter1 = new GenModelPlotter(genModel, painter1)
    // plotter2 = new GenModelPlotter(genModel, painter2)
    // pbRegionMap.drive(plotter2)
    // console.log("Plotted fpoon2.png")
    regionMap.drive(plotter1)
    console.log("Plotted spirit.png")
    console.log("Finished!")
  }
}

@Module({
  imports: [SharedArtBlockstoreModule, PlottingModule],
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
