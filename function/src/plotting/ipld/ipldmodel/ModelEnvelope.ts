import { ISerdes } from "../../../ipld/interface/ISerdes.js"
import {
   UnionAsDomainModel,
   UnionAsRepresentation,
   RepresentUnionPair,
} from "../../../ipld/interface/index.js"
import { RepresentRegionMapPair } from "./RegionMap.js"

// export interface ModelEnvelopeUnion {
//    ["RegionMap"]: RepresentRegionMapPair
// }
export type ModelEnvelopeUnion = Record<"RegionMap", RepresentRegionMapPair>

export type ModelEnvelope = UnionAsDomainModel<ModelEnvelopeUnion>

export type ModelEnvelopeRepresentation =
   UnionAsRepresentation<ModelEnvelopeUnion>

export type RepresentModelEnvelopePair = RepresentUnionPair<ModelEnvelopeUnion>

export type IModelEnvelopeSerdes = ISerdes<RepresentModelEnvelopePair>
