import { Block, ByteView } from "multiformats/block.js"

export interface ISchemaSerdes<Representation, DomainModel> {
  /**
   * Transform-to-representation and Encode
   */
  encodeModel: ( model: DomainModel ) => Promise<Block<Representation>>

  /**
   * Decode
   * @param bytes 
   * @returns Decoded Block
   */
  bytesToBlock: ( bytes: ByteView<Representation> ) => Promise<Block<Representation>>
  /**
   * Decode and Transform-to-domain
   * @param bytes 
   * @returns Domain model from a decoded block
   */
  bytesToDomain: ( bytes: ByteView<Representation> ) => Promise<DomainModel>
  /**
   * Transform-to-domain
   * @param block 
   * @returns Domain model
   */
  blockToDomain: ( block: Block<Representation> ) => Promise<DomainModel>
}