import { Block, ByteView } from "multiformats/block.js"

import { ModelEnvelope } from "./ModelEnvelope.js"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

export interface ISchemaSerdes<Representation,DomainModel> {
  encode: (model: DomainModel) => ByteView<Representation>
  decode: (bytes: ByteView<Representation>) => DomainModel
}
