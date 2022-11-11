import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID } from "multiformats"

import { create, createValidate, fromDSL } from "../../plotting/components/IpldSchemaTools.mjs"
import { IRandomArtTaskSchemaDsl } from "../interface/index.js"

const schemaDsl = `type ModelEnvelope union {
  | RandomArtTask "RandomArtTask_0.0.0"
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

export interface RandomArtTask {
  prefix: Uint8Array
  suffix: Uint8Array
  plotMap: CID
}

// const modelBuf = fs.readFileSync("./fdoc.proto")
// const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
// const plotData = plotDocument.getData()
// if (plotData === undefined || plotData === null) {
// throw new Error("Plot Data subunit must be defined!")
// }

@Injectable()
export class RandomArtTaskSchemaDsl implements IRandomArtTaskSchemaDsl {
  // parse schema
  private readonly schemaDmt = fromDSL(schemaDsl)

  // create a typed converter/validator
  private readonly rootTyped = create(this.schemaDmt, "ModelEnvelope")
  private readonly dataTyped = create(this.schemaDmt, "DataBlock")
  private readonly validate = createValidate(this.schemaDmt)

  // public toRegionMapRepresentation (typed: RegionMap): unknown {
  //   return this.rootTyped.toRepresentation(typed)
  // }

  // public toRegionMapTyped (representation: unknown): RegionMap {
  //   return this.rootTyped.toTyped(representation)
  // }

  // public toDataBlockRepresentation (typed: DataBlock): unknown {
  //   return this.dataTyped.toRepresentation(typed)
  // }

  // public toDataBlockTyped (representation: unknown): DataBlock {
  //   return this.dataTyped.toTyped(representation)
  // }
}
