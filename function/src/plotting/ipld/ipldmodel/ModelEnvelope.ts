import { ISerdes } from "../../../ipld/interface/ISerdes.js"
import {
   UnionAsDomainModel,
   UnionAsRepresentation,
   RepresentUnionPair,
} from "../../../ipld/interface/index.js"
import { RepresentRegionMapTuple } from "./RegionMap.js"

// export interface ModelEnvelopeUnion {
//    ["RegionMap"]: RepresentRegionMapPair
// }
export interface ModelEnvelopeUnion {
   ["RegionMap_1.0.0"]: RepresentRegionMapTuple
}

export type ModelEnvelope = UnionAsDomainModel<
   "RegionMap_1.0.0",
   ModelEnvelopeUnion
>

export type ModelEnvelopeRepresentation = UnionAsRepresentation<
   "RegionMap_1.0.0",
   ModelEnvelopeUnion
>

export type RepresentModelEnvelopePair = RepresentUnionPair<
   "ModelEnvelope",
   "RegionMap_1.0.0",
   ModelEnvelopeUnion
>

export type IModelEnvelopeSerdes = ISerdes<RepresentModelEnvelopePair>
