import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { BaseBlockstore } from "blockstore-core"
import * as Block from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { IpfsModule } from "../ipfs/di/IpfsModule.js"
import { IpfsModuleTypes } from "../ipfs/di/typez.js"
import { create, fromDSL } from "./BlocksToy3Util.mjs"

// a schema for a terse data format
const schemaDsl = `
type ModelEnvelope union {
  | PlotData "1.0.0"
} representation envelope {
  discriminantKey "version"
  contentKey "model"
}

type PlotData struct {
  pixelRef RefPoint
  resolution ImageSize
  regionBoundary RegionBoundary
  points RegionMap
} representation tuple

type RegionBoundary struct {
  precision Int
  top Int
  bottom Int
  left Int
  right Int
} representation tuple

type ImageSize struct {
  pixelHeight Int
  pixelWidth Int
} representation tuple

type RefPoint enum {
  | Center     ("1")
  | TopLeft    ("2")
} representation int

type RegionMap union {
  | UniformRegion "true"
  | DetailedRegion "false"
} representation inline {
  discriminantKey "uniform"
}

type UniformRegion struct {
  precision Int
  row &VectorEnvelope
  col &VectorEnvelope
} representation map

type DetailedRegion struct {
  precision Int
  rowsPerBlock Int
  rows [&VectorEnvelope]
  colsPerBlock Int
  cols [&VectorEnvelope]
} representation map

type VectorEnvelope union {
  | Vector "1.0.0"
} representation envelope {
  discriminantKey "version"
  contentKey "points"
}

type Vector [Int]
`

// parse schema
const schemaDmt = fromDSL(schemaDsl)

// create a typed converter/validator
const rootTyped = create(schemaDmt, "ModelEnvelope")
const vectorTyped = create(schemaDmt, "VectorEnvelope")

function range (from: number, to: number): number[] {
  const size = to - from + 1
  const retVal = new Array(size)
  let idx: number
  for (idx = 0; idx < size; idx++) {
    retVal[idx] = to - idx
  }
  return retVal
}

async function handleModel (): Promise<void> {
  // some terse input data
  const data = { version: "1.0.0", model: [1, [480, 640], [1, 1, -1, -1, 1], { uniform: "false", precision: 100, rowsPerBlock: 2, rows: [], colsPerBlock: 2, cols: [] }] }
  // const vector = { version: "1.0.0", points: [1, 2, 3, 4, 5, 6] }
  const vector = { version: "1.0.0", points: range(1, 1048576 + 241) }
  console.log("Representaton Form: Data")
  console.dir(data, { depth: Infinity })
  console.log("Representaton Form: Vector")
  console.dir(vector, { depth: Infinity })

  // validate and transform
  const typedData = rootTyped.toTyped(data)
  if (typedData === undefined) {
    throw new TypeError("Invalid data form, does not match schema")
  }
  const typedVector = vectorTyped.toTyped(vector)
  if (typedVector === undefined) {
    throw new TypeError("Bad2")
  }

  // what do we have?
  console.log("Typed form: Data")
  console.dir(typedData, { depth: Infinity })
  console.log("Typed form: Vector")
  console.dir(typedVector, { depth: Infinity })

  // validate and transform back into representation form
  const newVector = vectorTyped.toRepresentation(typedVector)
  if (newVector === undefined) {
    throw new TypeError("Invalid2")
  }
  console.log("Return to representation: Vector")
  console.dir(newVector, { depth: Infinity })

  // what do we have?
  const vectorBlock = await Block.encode({
    codec,
    hasher,
    value: newVector
  })
  console.log("Vector as Encoded Block")
  console.dir(vectorBlock, { depth: Infinity })

  typedData.PlotData.points.DetailedRegion.cols.push(vectorBlock.cid)
  typedData.PlotData.points.DetailedRegion.rows.push(vectorBlock.cid)
  console.log("Modified data")
  console.dir(typedData, { depth: Infinity })

  const newData = rootTyped.toRepresentation(typedData)
  if (newData === undefined) {
    throw new TypeError("Invalid data form, does not match schema")
  }
  console.log("Back to Representation again: Data")
  console.dir(newData, { depth: Infinity })

  const rootBlock = await Block.encode({
    codec,
    hasher,
    value: newData
  })

  console.log("Encoded Root Block")
  console.dir(rootBlock, { depth: Infinity })
  console.dir(rootBlock.bytes, { depth: Infinity })
  console.dir(rootBlock.value, { depth: Infinity })

  const blockObject = await Block.decode({
    codec,
    hasher,
    bytes: rootBlock.bytes
  })
  console.log("Decoded Block")
  console.dir(blockObject, { depth: Infinity })
  console.dir(blockObject.bytes, { depth: Infinity })
  console.dir(blockObject.value, { depth: Infinity })

  const rootTwo = rootTyped.toTyped(blockObject.value)
  console.log("Decoded Block Value, Typed")
  console.dir(rootTwo, { depth: Infinity })
}

@Injectable()
export class AppService {
  constructor (
    @Inject(IpfsModuleTypes.AbstractBlockstore)
    private readonly fsBlockstore: BaseBlockstore
  ) { }

  public async doWork (): Promise<void> {
    console.log(this.fsBlockstore)
    await this.fsBlockstore.open()
    console.log("Blockstore is open")
    await handleModel()
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
