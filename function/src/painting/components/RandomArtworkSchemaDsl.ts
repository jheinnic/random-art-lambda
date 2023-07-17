import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable, Module } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID, BlockView } from "multiformats"
import { encode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { create, createValidate, fromDSL } from "../../ipld/components/IpldSchemaTools.mjs"
import { IRandomArtworkSchemaDsl, ModelEnvelopeRepresentation, RandomArtworkSpec } from "../interface/index.js"

const schemaDsl = `type ModelEnvelope union {
  | RandomArtworkSpec "RandomArtworkSpec_0.1.0"
  | Prefix "Prefix_0.0.1"
} representation envelope {
  discriminantKey "repoVersion"
  contentKey "model"
}

type Prefix Bytes

type RandomArtworkSpec struct {
  prefix Bytes
  suffix Bytes
  regionMap Link
  engineVersion String
} representation tuple
`

@Injectable()
export class RandomArtworkSchemaDsl implements IRandomArtworkSchemaDsl {
  // parse schema
  private readonly schemaDmt = fromDSL( schemaDsl )

  // create a typed converter/validator
  private readonly converter = create( this.schemaDmt, "ModelEnvelope" )
  private readonly validate = createValidate( this.schemaDmt )
  public readonly toRepresentation = this.converter.toRepresentation
  public readonly toTyped = this.converter.toTyped

  public async toBlock( typed: RandomArtworkSpec ): Promise<BlockView<ModelEnvelopeRepresentation>> {
    const specData = this.converter.toRepresentation( { RandomArtworkSpec: typed } )
    if ( specData === undefined ) {
      throw new TypeError( "Invalid typed form, does not match schema" )
    }
    const block: BlockView<ModelEnvelopeRepresentation> = await encode<ModelEnvelopeRepresentation, 113, 18>(
      { codec, hasher, value: specData } )
    return block
  }

  public fromBlock( block: BlockView<ModelEnvelopeRepresentation> ): RandomArtworkSpec {
    return this.converter.toTyped( block.value ).RandomArtModel
  }
}
