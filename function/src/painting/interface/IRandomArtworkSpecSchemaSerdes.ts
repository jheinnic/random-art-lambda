import { ISerdes } from '../../ipld/interface/index.js'
import { CID } from 'multiformats/cid'
import { RandomArtworkSpec } from './RandomArtworkSpec.js'
import { UnionAsRepresentation, UnionAsDomainModel } from '../../ipld/interface/index.js'

type RandomArtworkSpecUnion = {
    [ "RandomArtworkSpec_0.1.0" ]: [ [ Uint8Array, Uint8Array, CID, string ], RandomArtworkSpec ]
}
export type ModelEnvelopeRepresentation = UnionAsRepresentation<RandomArtworkSpecUnion, "repoVersion", "model">
export type ModelEnvelope = UnionAsDomainModel<RandomArtworkSpecUnion>

export type IRandomArtworkSpecSchemaSerdes = ISerdes<[ ModelEnvelopeRepresentation, ModelEnvelope ]>