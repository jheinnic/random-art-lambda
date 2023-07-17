import { BlockView } from "multiformats"

import { ModelEnvelopeRepresentation } from "./IRandomArtworkSpecSchemaSerdes.js"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

export interface IRandomArtworkSchemaDsl {
  toRepresentation: ( typed: RandomArtworkSpec ) => unknown
  toTyped: ( representation: unknown ) => RandomArtworkSpec
  toBlock: ( typed: RandomArtworkSpec ) => Promise<BlockView<ModelEnvelopeRepresentation>>
  fromBlock: ( block: BlockView<ModelEnvelopeRepresentation> ) => RandomArtworkSpec
}
