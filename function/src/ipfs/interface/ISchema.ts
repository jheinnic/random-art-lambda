import { Block, ByteView } from "multiformats/block.js"

import { ModelEnvelope } from "./ModelEnvelope.js"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

export interface ISchema<Representation,DomainModel> {
  bytesToBlock: (bytes: ByteView<Representation>) => Block<Representation>
  modelToBlock: (model: DomainModel) => Block<Representation>
  bytesToModel: (bytes: ByteView<Representation>) => DomainModel
  blockToModel: (block: Block<Representation>) => DomainModel
}
