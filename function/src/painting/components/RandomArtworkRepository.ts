import * as codec from "@ipld/dag-cbor"
import { Inject, Injectable } from "@nestjs/common"
import { Blockstore } from "interface-blockstore"
import { CID } from "multiformats"
import { Block, decode, encode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { SharedBlockstoresModuleTypes } from "../../app/di/index.js"
import { BUILD_VERSION, RELEASE_VERSION } from "../../app/interfaces/index.js"
import { PaintingModuleTypes } from "../di/PaintingModuleTypes"
import {
  IRandomArtwork,
  IRandomArtworkRepository,
  IRandomArtworkSchemaDsl,
  ModelEnvelopeRepresentation,
  RandomArtworkSpec,
} from "../interface/index.js"

@Injectable()
export class RandomArtworkRepository implements IRandomArtworkRepository {
  constructor (
    @Inject( SharedBlockstoresModuleTypes.SharedArtBlockstore )
    private readonly blockStore: Blockstore,
    @Inject( PaintingModuleTypes.IRandomArtworkSchemaDsl )
    private readonly schemaDsl: IRandomArtworkSchemaDsl
  ) { }


  public async save( source: IRandomArtwork ): Promise<CID> {
    // validate and transform ro block-encodable representation form
    const sourceData: RandomArtworkSpec = {
      prefix: source.prefix,
      suffix: source.suffix,
      regionMap: source.regionMap,
      engineVersion: `${ RELEASE_VERSION }.${ BUILD_VERSION }`
    }
    // Encode
    const rootBlock = await this.schemaDsl.toBlock( sourceData )
    // Store
    await this.blockStore.put( rootBlock.cid, rootBlock.bytes, {} )
    return rootBlock.cid
  }

  public async load( cid: CID ): Promise<IRandomArtwork> {
    const bytes = await this.blockStore.get( cid )
    const rootBlock = await decode<ModelEnvelopeRepresentation, 113, 18>( { codec, hasher, bytes } )
    const typedData = this.schemaDsl.fromBlock( rootBlock )
    console.dir( typedData, { depth: Infinity } )
    console.log( typedData.constructor.name )

    return typedData as IRandomArtwork
  }
}
