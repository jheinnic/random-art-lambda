import { ISerdes } from "../../ipld/interface/ISerdes.js"
import { UnionDefinition, UnionAsDomainModel, UnionAsRepresentation, RepresentUnionPair } from "../../ipld/interface/index.js"
import { RepresentRegionMapPair } from "./RegionMap.js"

export type ModelEnvelopeUnion = {
    [ "RegionMap_1.0.0" ]: RepresentRegionMapPair
}

export type ModelEnvelope = UnionAsDomainModel<ModelEnvelopeUnion>

export type ModelEnvelopeRepresentation = UnionAsRepresentation<ModelEnvelopeUnion>

export type RepresentModelEnvelopePair = RepresentUnionPair<ModelEnvelopeUnion>

export type IModelEnvelopeSerdes = ISerdes<RepresentModelEnvelopePair>
