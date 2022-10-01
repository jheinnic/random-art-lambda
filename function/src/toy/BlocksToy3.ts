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


const { newPicture } = pkg

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
    const plotCid = await this.adapter.transfer(plotData, 64)
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
