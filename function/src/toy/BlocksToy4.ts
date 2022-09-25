import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import * as fs from "fs"
import * as math from "mathjs"
import { CID } from "multiformats"
import { base64 } from "multiformats/bases/base64"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { IpfsModule } from "../ipfs/di/IpfsModule.js"
import { IpfsModuleTypes } from "../ipfs/di/typez.js"
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

export interface IModelBuilder {
  prefix: (bytes: Uint8Array) => IModelBuilder
  suffix: (bytes: Uint8Array) => IModelBuilder
  plotMap: (link: CID) => IModelBuilder
}

const NO_TERM = Uint8Array.of()

class ModelBuilder implements IModelBuilder {
  private _prefix: Uint8Array = NO_TERM
  private _suffix: Uint8Array = NO_TERM
  private _plotMap?: CID

  constructor (private readonly _repository: RandomArtTaskRepository) {
  }

  public prefix (bytes: Uint8Array): ModelBuilder {
    this._prefix = bytes
    return this
  }

  public suffix (bytes: Uint8Array): ModelBuilder {
    this._suffix = bytes
    return this
  }

  public plotMap (link: CID): ModelBuilder {
    this._plotMap = link
    return this
  }

  public async build (): Promise<CID> {
    const source = {
      prefix: this._prefix,
      suffix: this._suffix,
      plotMap: this._plotMap!
    }
    return await this._repository.save(source)
  }
}

export class RandomArtTaskRepository {
  constructor (@Inject(IpfsModuleTypes.AbstractBlockstore) private readonly blockStore: BaseBlockstore) { }

  public async create (director: (builder: IModelBuilder) => void): Promise<CID> {
    const builder = new ModelBuilder(this)
    director(builder)
    return await builder.build()
  }

  public async save (source: RandomArtTask): Promise<CID> {
    // validate and transform
    const sourceData = rootTyped.toRepresentation({ RandomArtTask: source })
    if (sourceData === undefined) {
      throw new TypeError("Invalid typed form, does not match schema")
    }

    // what do we have?
    // console.log("Representation form:", sourceData)
    // console.dir(sourceData, { depth: Infinity })

    // validate and transform back into representation form
    // what do we have?
    // console.log("Modified representation data:", JSON.stringify(newData))
    const rootBlock = await Block.encode({ codec, hasher, value: sourceData })
    // console.log("Root block, encoded")
    // console.dir(rootBlock, { depth: Infinity })
    await this.blockStore.put(rootBlock.cid, rootBlock.bytes, {})

    const blockObject = await Block.decode({ codec, hasher, bytes: rootBlock.bytes })
    // console.log("Root block, decoded")
    // console.dir(blockObject, { depth: Infinity })
    const rootTwo = rootTyped.toTyped(blockObject.value)
    console.dir(rootTwo, { depth: Infinity })
    console.log(rootTwo.constructor.name)

    return rootBlock.cid
  }
}

@Injectable()
export class AppService {
  constructor (
    @Inject(IpfsModuleTypes.AbstractBlockstore)
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
      const raTask = await this.repository.create((builder: IModelBuilder) => {
        builder.prefix(prefix).suffix(suffix).plotMap(plotMap)
      })
      console.log(raTask)
    }
    console.log("Finished!")
  }
}

@Module({
  imports: [
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: IpfsModuleTypes.AbstractBlockstore}
  )
  ],
  providers: [AppService, RandomArtTaskRepository],
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
