import { Injectable } from "@nestjs/common"

import { IRegionMapSchemaDsl } from "../interface/IRegionMapSchemaDsl.js"
import { DataBlock, RegionMap } from "../interface/RegionMapSchemaTypes.js"
import { create, createValidate, fromDSL } from "./IpldSchemaTools.mjs"

// import { create, fromDsl } from "./IpldSchemaTools.mjs"

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
  data [&DataBlock]
} representation tuple

type BitLayout struct {
  palette Bytes
  paletteWordLen Int
  baseWordLen Int
} representation tuple

type DimensionLayouts struct {
  rowsN BitLayout
  rowsD BitLayout
  colsN BitLayout
  colsD BitLayout
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

// const modelBuf = fs.readFileSync("./fdoc.proto")
// const plotDocument = PointPlotDocument.deserializeBinary(modelBuf)
// const plotData = plotDocument.getData()
// if (plotData === undefined || plotData === null) {
// throw new Error("Plot Data subunit must be defined!")
// }

@Injectable()
export class IpldRegionMapSchemaDsl implements IRegionMapSchemaDsl {
  private readonly schemaDmt = fromDSL( schemaDsl )
  private readonly rootTyped = create( this.schemaDmt, "ModelEnvelope" )
  private readonly dataTyped = create( this.schemaDmt, "DataBlock" )
  private readonly validate = createValidate( this.schemaDmt )

  public toRegionMapRepresentation( typed: RegionMap ): unknown {
    return this.rootTyped.toRepresentation( typed )
  }

  public toRegionMapTyped( representation: unknown ): RegionMap {
    return this.rootTyped.toTyped( representation )
  }

  public toDataBlockRepresentation( typed: DataBlock ): unknown {
    return this.dataTyped.toRepresentation( typed )
  }

  public toDataBlockTyped( representation: unknown ): DataBlock {
    return this.dataTyped.toTyped( representation )
  }
}
