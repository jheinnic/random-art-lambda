import { ByteView, BlockView } from "multiformats"
import {
   DomainModelOf,
   RepresentationOf,
   RepresentDomainTuple,
} from "./RepresentDomainPair.js"

export interface ISerdes<
   RD extends RepresentDomainTuple<string, unknown, unknown>,
> {
   /**
    * Transform-to-representation and Encode
    *
    * We don't go all the way to a ByteView so the caller can retrieve a CID
    * before passing the block's ByteView to a Blockstore.  Blockstore, ironically,
    * does not transact in BlockViews but only ByteVies.
    */
   encodeModel: (
      model: DomainModelOf<RD>,
   ) => Promise<BlockView<RepresentationOf<RD>>>

   /**
    * Decode
    * @param bytes
    * @returns Decoded Block
    */
   // bytesToBlock: (bytes: ByteView<DomainModelOf<RD>>) => Promise<BlockView<RepresentationOf<RD>>>

   /**
    * Decode and Transform-to-domain
    * @param bytes
    * @returns Domain model from a decoded block
    */
   decodeBytes: (
      bytes: ByteView<RepresentationOf<RD>>,
   ) => Promise<DomainModelOf<RD>>
   /**
    * Transform-to-domain
    *
    * Not used because the Blockstore interface only deals with ByteViews.
    *
    * @param block
    * @returns Domain model
    */
   // blockToDomain: (block: BlockView<DomainModelOf<RD>>) => Promise<RepresentationOf<RD>>
}
