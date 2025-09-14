// import { sha256 as hasher } from "multiformats/hashes/sha2"
// import * as codec from "@ipld/dag-cbor"

import {
   RepresentModelEnvelopePair,
   RepresentDataBlockTuple,
} from "../ipldmodel/index.js"
import { UnionizeProperties } from "simplytyped"

export const schemaDsl = `type ModelEnvelope union {
  | RegionMap "RegionMap_1.0.0"
  | RegionMap2 "RegionMap_2.0.0"
} representation envelope {
  discriminantKey "version"
  contentKey "model"
}

type RegionMap struct {
  pixelRef RefPoint
  imageSize ImageSize
  projected Bool
  regionBoundary RegionBoundaryFractions
  codings DimensionLayouts
  palettes [&DataBlock]
  data [&DataBlock]
} representation tuple

type RegionMap2 struct {
  pixelRef RefPoint2
  imageSize ImageSize
  regionBoundary RegionBoundaryFractions
  codings DimensionLayouts
  palettes [&DataBlock]
  data [&DataBlock]
  pixelSize ImageSize
  rowsPerBatch [Int]
  batchCount Int
} representation tuple

type BitLayout struct {
  paletteWordLen Int
  baseWordLen Int
} representation tuple

type DimensionLayouts struct {
  rowsN BitLayout
  rowsD BitLayout
  colsN BitLayout
  colsD BitLayout
} representation tuple

type RegionBoundaryFractions struct {
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

type RefPoint2 enum {
  | Center     ("1")
  | TopLeft    ("2")
  | Rolling    ("3")
} representation int

type DataBlock struct {
  rowsN Bytes
  rowsD Bytes
  colsN Bytes
  colsD Bytes
} representation tuple
`

interface ISerdesTypes {
   ModelEnvelope: RepresentModelEnvelopePair
   DataBlock: RepresentDataBlockTuple
}

export type SerdesRepresentDomainTuples = UnionizeProperties<ISerdesTypes>

// export const ipldModuleOptions: IpldModuleExtras<
//    RepresentDataBlockTuple | RepresentModelEnvelopePair
// > = {
//    serdes: new SerdesConfiguration<
//       RepresentModelEnvelopePair | RepresentDataBlockTuple
//    >(
//       schemaDsl,
//       {
//          ModelEnvelope: IpldPlottingModuleTypes.IModelEnvelopeSerdes,
//          DataBlock: IpldPlottingModuleTypes.IDataBlockSerdes,
//       },
//       codec,
//       hasher,
//    ),
// }
