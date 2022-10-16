import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import * as fs from "fs"
import { CID } from "multiformats"
import { base64 } from "multiformats/bases/base64"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { IpfsModule } from "../ipfs/di/IpfsModule.js"
import { SharedArtBlockstoreModule } from "../ipfs/di/SharedArtBlockstoreModule.js"
import { IpfsModuleTypes, SharedArtBlockstoreModuleTypes } from "../ipfs/di/typez.js"
import { RandomArtTaskRepository } from "../painting/components/RandomArtTaskRepository.js"
import { IRandomArtTaskBuilder } from "../painting/interface/IRandomArtTaskBuilder.js"
import { IRandomArtTaskRepository } from "../painting/interface/IRandomArtTaskRepository.js"
import { PlottingModule } from "../plotting/di/PlottingModule.js"
import { create, fromDSL } from "./BlocksToy3Util.mjs"

// a schema for a terse data format
const schemaDsl = `type ModelEnvelope union {
  | RandomArtTask "RandomArtTask_1.0.0"
} representation envelope {
  discriminantKey "version"
  contentKey "model"
}

type RandomArtTask struct {
  prefix Bytes
  suffix Bytes
  plotMap Link
} representation tuple
`

// parse schema
const schemaDmt = fromDSL(schemaDsl)

// create a typed converter/validator
const rootTyped = create(schemaDmt, "ModelEnvelope")

export interface RandomArtTask {
  prefix: Uint8Array
  suffix: Uint8Array
  plotMap: CID
}

// export interface IRandomArtTaskBuilder {
//   prefix: (bytes: Uint8Array) => IRandomArtTaskBuilder
//   suffix: (bytes: Uint8Array) => IRandomArtTaskBuilder
//   plotMap: (link: CID) => IRandomArtTaskBuilder
// }

@Injectable()
export class AppService {
  constructor (
    @Inject(SharedArtBlockstoreModuleTypes.SharedArtBlockstore)
    private readonly fsBlockstore: BaseBlockstore,
    @Inject(RandomArtTaskRepository)
    private readonly repository: RandomArtTaskRepository
  ) { }

  public async doWork (): Promise<void> {
    console.log(this.fsBlockstore)
    await this.fsBlockstore.open()
    console.log("Blockstore is open")
    const modelBuf = fs.readFileSync("minis.tsv").toString()
    const modelLines = modelBuf.split("\n")
    let modelLine
    for (modelLine of modelLines) {
      const fields = modelLine.split("\t")
      const prefix = base64.baseDecode(fields[0])
      const suffix = base64.baseDecode(fields[1])
      const plotMap = CID.parse(fields[2])
      const raTask = await this.repository.create((builder: IRandomArtTaskBuilder) => {
        builder.prefix(prefix).suffix(suffix).plotMap(plotMap)
      })
      console.log(raTask)
    }
    console.log("Finished!")
  }
}

@Module({
  imports: [ SharedArtBlockstoreModule, PlottingModule],
  // IpfsModule.register(
// { rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: IpfsModuleTypes.AbstractBlockstore}
  // )
  providers: [AppService, RandomArtTaskRepository],
  exports: [AppService]
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
