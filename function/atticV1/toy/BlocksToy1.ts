import * as codec from "@ipld/dag-pb"
import { Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import * as fs from "fs"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { IpfsModule } from "../ipfs/di/IpfsModule.js"
import { IpfsModuleTypes } from "../ipfs/di/typez.js"

const { createLink, createNode } = codec

// Suffix
const bufOne = [109, 116, 103, 64, 72, 112, 115, 108, 109, 101, 66, 126, 62]

// Prefix
const bufTwo = [
  107, 98, 102, 119, 97, 32, 32, 101, 109, 97, 118, 109, 118, 98, 122
]

// PlotMap
const proto = fs.readFileSync(
  "/home/ionadmin/Git/lambdas/random-art-lambda/function/fdoc.proto"
)
const proto2 = fs.readFileSync(
  "/home/ionadmin/Git/lambdas/random-art-lambda/function/gdoc.proto"
)

async function run2 (): Promise<void> {
  const prefixNode = createNode(Uint8Array.from(bufOne), [])
  const suffixNode = createNode(Uint8Array.from(bufTwo), [])
  const plotMapNode = createNode(Uint8Array.from(proto), [])
  const plotMapNode2 = createNode(Uint8Array.from(proto2), [])

  const prefixBlock = await Block.encode({
    codec,
    hasher,
    value: prefixNode
  })
  const suffixBlock = await Block.encode({
    codec,
    hasher,
    value: suffixNode
  })
  const plotMapBlock = await Block.encode({
    codec,
    hasher,
    value: plotMapNode
  })
  const plotMapBlock2 = await Block.encode({
    codec,
    hasher,
    value: plotMapNode2
  })

  const prefixCid = prefixBlock.cid.toV0()
  const suffixCid = suffixBlock.cid.toV0()
  const plotMapCid = plotMapBlock.cid.toV0()
  const plotMap2Cid = plotMapBlock2.cid.toV0()

  console.log(`PrefixCID: ${prefixCid.toString()}`)
  console.log(`SuffixCID: ${suffixCid.toString()}`)
  console.log(`PlotMapCID: ${plotMapCid.toString()}`)
  console.log(`PlotMap2CID: ${plotMap2Cid.toString()}`)
}

@Injectable()
export class AppService {
  constructor (private readonly fsBlockstore: BaseBlockstore) {}

  public async doWork (): Promise<void> {
    console.log(this.fsBlockstore)
    await this.fsBlockstore.open()
    console.log("Blockstore is open")
  }
}

@Module({
  imports: [
  IpfsModule.register(
    { rootPath: "/home/ionadmin/Documents/raBlocks", cacheSize: 500, injectToken: IpfsModuleTypes.AbstractBlockstore}
  )
  ],
  providers: [AppService],
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
