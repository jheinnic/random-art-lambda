/// <reference path="../painting/components/genjs6.d.ts"/>
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
import * as pkg from "../painting/components/genjs6.js"
import { GenModelPlotter } from "../painting/components/GenModelPlotter.js"
import { IRegionPlotter } from "../painting/interface/IRegionPlotter.js"
import { IpldRegionMapRepository } from "../plotting/components/IpldRegionMapRepository.js"
import { PlottingModule } from "../plotting/di/PlottingModule.js"
import { PlottingModuleTypes } from "../plotting/di/typez.js"
import { PBufAdapter } from "../plotting/protobuf/PBufAdapter.js"
import { PBufRegionMap } from "../plotting/protobuf/PBufRegionMap.js"
import { PointPlotData, PointPlotDocument, RefPoint } from "../plotting/protobuf/plot_mapping_pb"

const { newPicture } = pkg

class LoggingPlotter implements IRegionPlotter {
  private readonly messages: string[] = []
  private index: number = 1

  constructor (
    private readonly streamOut: fs.WriteStream
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

  public finish (): boolean {
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
    private readonly adapter: PBufAdapter
  ) { }

  public async doWork (): Promise<void> {
    console.log(this.fsBlockstore)
    await this.fsBlockstore.open()
    console.log("Blockstore is open")
    const modelBuf = fs.readFileSync("fdoc.proto")

    const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
    const plotData = plotDocument.getData()
    if ((plotData === undefined) || (plotData === null)) {
      console.error("Not Plot Data!")
      throw new Error()
    }
    const plotCid = await this.adapter.transfer(plotData, 64)
    console.log(plotCid)
    const regionMap = await this.repository.load(plotCid)
    const pbRegionMap = new PBufRegionMap(plotData)
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
    let canvas: Canvas = new Canvas(1024, 1024)
    let painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./famine1.png"))
    // let painter2 = new CanvasPixelPainter(canvas, fs.createWriteStream("./falcon2.png"))
    let plotter1 = new GenModelPlotter(genModel, painter1)
    // let plotter2 = new GenModelPlotter(genModel, painter2)

    console.log("Starting first plot!")
    // pbRegionMap.drive(plotter2)
    // console.log("Plotted faloon2.png")
    regionMap.drive(plotter1)
    console.log("Plotted faloon1.png")
    canvas = new Canvas(1024, 1024)
    const prefix2 = [...Buffer.from("mv8f5f85676\":KP}567r8ft89tyfjfgrfygfrtgrgh5f76hfrghtfjuyhjufygyhfgyfurrrrrrtgfhttyuyh4ehfhyufiujffyu87fyh5f9kvv08ypop")]
    genModel = newPicture(prefix2, suffix)
    painter1 = new CanvasPixelPainter(canvas, fs.createWriteStream("./manon1.png"))
    // painter2 = new CanvasPixelPainter(canvas, fs.createWriteStream("./manon2.png"))
    plotter1 = new GenModelPlotter(genModel, painter1)
    // plotter2 = new GenModelPlotter(genModel, painter2)
    // pbRegionMap.drive(plotter2)
    // console.log("Plotted fpoon2.png")
    regionMap.drive(plotter1)
    console.log("Plotted fpoon1.png")
    console.log("Finished!")
  }
}

@Module({
  imports: [
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: IpfsModuleTypes.AbstractBlockstore}
  ),
  PlottingModule
  ],
  providers: [AppService, PBufAdapter],
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
