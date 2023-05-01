import * as codec from "@ipld/dag-cbor"
import { Injectable } from "@nestjs/common"
import { ByteView, Block, encode, decode } from "multiformats/block"
import { sha256 as hasher } from "multiformats/hashes/sha2"

import { ISchemaSerdes } from "../interface/index.js"

@Injectable()
export class IpldSchemaSerdes<Representation, DomainModel> implements ISchemaSerdes<Representation, DomainModel> {
  constructor (
    private toRepresentation: ( source: DomainModel ) => Representation,
    private toDomainModel: ( source: Representation ) => DomainModel
    // private validate: () => true
  ) { }

  /**
     * Transform-to-representation and Encode
     */
  public async encodeModel( typed: DomainModel ): Promise<Block<Representation>> {
    const specData = this.toRepresentation( typed )
    if ( specData === undefined ) {
      throw new TypeError( "Invalid typed form, does not match schema" )
    }
    const block: Block<Representation> = await encode<Representation, 113, 18>(
      { codec, hasher, value: specData } )
    return block
  }

  /**
   * Decode
   * @param bytes 
   * @returns Decoded Block
   */
  public async bytesToBlock( bytes: ByteView<Representation> ): Promise<Block<Representation>> {
    const block = await decode<Representation, 113, 18>( { codec, hasher, bytes } )
    return block
  }

  /**
   * Decode and Transform-to-domain
   * @param bytes 
   * @returns Domain model from a decoded block
   */
  public async bytesToDomain( bytes: ByteView<Representation> ): Promise<DomainModel> {
    const domainModel = await this.blockToDomain(
      await this.bytesToBlock( bytes ) )
    return domainModel
  }

  /**
   * Transform-to-domain
   * @param block 
   * @returns Domain model
   */
  public async blockToDomain( block: Block<Representation> ): Promise<DomainModel> {
    const domainModel = this.toDomainModel( block.value )
    if ( domainModel === undefined ) {
      throw new TypeError( "Invalid representation form, does not match schema" )
    }
    return domainModel
  }
}
