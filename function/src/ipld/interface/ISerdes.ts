import { ByteView, BlockView } from "multiformats"
import { RepresentDomainPair } from "./RepresentDomainPair.js"

export interface ISerdes<RD extends RepresentDomainPair> {
  /**
   * Transform-to-representation and Encode
   */
  encodeModel: ( model: RD[ 1 ] ) => Promise<BlockView<RD[ 0 ]>>

  /**
   * Decode
   * @param bytes 
   * @returns Decoded Block
   */
  bytesToBlock: ( bytes: ByteView<RD[ 0 ]> ) => Promise<BlockView<RD[ 0 ]>>
  /**
   * Decode and Transform-to-domain
   * @param bytes 
   * @returns Domain model from a decoded block
   */
  bytesToDomain: ( bytes: ByteView<RD[ 0 ]> ) => Promise<RD[ 1 ]>
  /**
   * Transform-to-domain
   * @param block 
   * @returns Domain model
   */
  blockToDomain: ( block: BlockView<RD[ 0 ]> ) => Promise<RD[ 1 ]>
}