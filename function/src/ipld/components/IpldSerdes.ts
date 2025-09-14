import { Injectable } from "@nestjs/common"
import type {
   ByteView,
   BlockView,
   BlockCodec,
   MultihashHasher,
} from "multiformats"
import { encode, decode } from "multiformats/block"
import type {
   RepresentDomainTuple,
   ISerdes,
   RepresentationOf,
   DomainModelOf,
} from "../interface/index.js"

@Injectable()
export class IpldSerdes<
   RDP extends RepresentDomainTuple<string, unknown, unknown>,
   Code extends number,
   Hash extends number,
> implements ISerdes<RDP>
{
   constructor(
      private readonly toRepresentation: (
         source: DomainModelOf<RDP>,
      ) => RepresentationOf<RDP>,
      private readonly toDomainModel: (
         source: RepresentationOf<RDP>,
      ) => DomainModelOf<RDP>,
      private readonly codec: BlockCodec<Code, RepresentationOf<RDP>>,
      private readonly hasher: MultihashHasher<Hash>,
      // private validate: () => true
   ) {}

   /**
    * Transform-to-representation and Encode
    */
   public async encodeModel(
      typed: DomainModelOf<RDP>,
   ): Promise<BlockView<RepresentationOf<RDP>>> {
      const specData = this.toRepresentation(typed)
      if (specData === undefined) {
         throw new TypeError("Invalid typed form, does not match schema")
      }
      // const block: BlockView<RepresentationOf<RDP>> = await encode<RepresentationOf<RDP>, 113, 18>(
      const codec = this.codec
      const hasher = this.hasher
      const block: BlockView<RepresentationOf<RDP>> = await encode<
         RepresentationOf<RDP>,
         Code,
         Hash
      >({
         codec,
         hasher,
         value: specData,
      })
      return block
   }

   /**
    * Decode and Transform-to-domain
    * @param bytes
    * @returns Domain model from a decoded block
    */
   public async decodeBytes(
      bytes: ByteView<RepresentationOf<RDP>>,
   ): Promise<DomainModelOf<RDP>> {
      const domainModel = await this.blockToDomain(
         await this.bytesToBlock(bytes),
      )
      return domainModel
   }

   /**
    * Decode
    * @param bytes
    * @returns Decoded Block
    */
   private async bytesToBlock(
      bytes: ByteView<RepresentationOf<RDP>>,
   ): Promise<BlockView<RepresentationOf<RDP>>> {
      const codec = this.codec
      const hasher = this.hasher
      const block = await decode<RepresentationOf<RDP>, Code, Hash>({
         codec,
         hasher,
         bytes,
      })
      if (block === undefined) {
         throw new TypeError(
            "Invalid deserialized representation, did not follow from schema",
         )
      }
      return block
   }

   /**
    * Transform-to-domain
    * @param block
    * @returns Domain model
    */
   private async blockToDomain(
      block: BlockView<RepresentationOf<RDP>>,
   ): Promise<DomainModelOf<RDP>> {
      const domainModel = this.toDomainModel(block.value)
      if (domainModel === undefined) {
         throw new TypeError(
            "Invalid deserialized representation form, did not follow schema",
         )
      }
      return domainModel
   }
}
