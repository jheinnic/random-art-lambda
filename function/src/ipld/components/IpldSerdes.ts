import { Injectable } from "@nestjs/common"
import { ByteView, BlockView } from "multiformats"
import { encode, decode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"
import * as codec from "@ipld/dag-cbor"

import { RepresentDomainPair, ISerdes } from "../interface/index.js"

@Injectable()
export class IpldSerdes<RDP extends RepresentDomainPair> implements ISerdes<RDP> {
  constructor (
    private toRepresentation: ( source: RDP[ 1 ] ) => RDP[ 0 ],
    private toDomainModel: ( source: RDP[ 0 ] ) => RDP[ 1 ]
    // private validate: () => true
  ) { }

  /**
     * Transform-to-representation and Encode
     */
  public async encodeModel( typed: RDP[ 1 ] ): Promise<BlockView<RDP[ 0 ]>> {
    const specData = this.toRepresentation( typed )
    if ( specData === undefined ) {
      throw new TypeError( "Invalid typed form, does not match schema" )
    }
    const block: BlockView<RDP[ 0 ]> = await encode<RDP[ 0 ], 113, 18>(
      { codec, hasher, value: specData } )
    return block
  }

  /**
   * Decode
   * @param bytes 
   * @returns Decoded Block
   */
  public async bytesToBlock( bytes: ByteView<RDP[ 0 ]> ): Promise<BlockView<RDP[ 0 ]>> {
    const block = await decode<RDP[ 0 ], 113, 18>( { codec, hasher, bytes } )
    return block
  }

  /**
   * Decode and Transform-to-domain
   * @param bytes 
   * @returns Domain model from a decoded block
   */
  public async bytesToDomain( bytes: ByteView<RDP[ 0 ]> ): Promise<RDP[ 1 ]> {
    const domainModel = await this.blockToDomain(
      await this.bytesToBlock( bytes ) )
    return domainModel
  }

  /**
   * Transform-to-domain
   * @param block 
   * @returns Domain model
   */
  public async blockToDomain( block: BlockView<RDP[ 0 ]> ): Promise<RDP[ 1 ]> {
    const domainModel = this.toDomainModel( block.value )
    if ( domainModel === undefined ) {
      throw new TypeError( "Invalid representation form, does not match schema" )
    }
    return domainModel
  }
}
