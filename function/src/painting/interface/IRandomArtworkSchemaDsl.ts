import { Block } from "multiformats/block.js"

import { ModelEnvelope } from "./ModelEnvelope.js"
import { RandomArtworkSpec } from "./RandomArtworkSpec.js"

export interface IRandomArtworkSchemaDsl {
  toRepresentation: (typed: RandomArtworkSpec) => unknown
  toTyped: (representation: unknown) => RandomArtworkSpec
  toBlock: (typed: RandomArtworkSpec) => Promise<Block<ModelEnvelope>>
  fromBlock: (block: Block<ModelEnvelope>) => RandomArtworkSpec
}
