import {
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING,
} from "./../../interface/SeedTypeExtensionPoint"
import {
   HEX_SEED_EXTENSION_ID,
   HEX_SEED_EXTENSION_ID_STR,
} from "./../interface/Constants"
import { IGenModelSeedExtension } from "../../interface/IGenModelSeedExtension.js"
import { IHexSeed } from "../interface/IHexSeed.js"
import { ReturnableSeedType, SeedType } from "../../interface/SeedTypes.js"

export class HexSeedExtension
   implements IGenModelSeedExtension<HEX_SEED_EXTENSION_ID, IHexSeed>
{
   readonly extensionFor: GEN_MODEL_SEED_TYPE_EXTENSION_POINT =
      GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING

   readonly extensionId: HEX_SEED_EXTENSION_ID = HEX_SEED_EXTENSION_ID_STR

   validate(input: IHexSeed): void {
      // TODO: Ensure prefix and suffix strings are both in hex
      const prefixBuf: Buffer<ArrayBuffer> = Buffer.from(input.prefix, "hex")
      if (prefixBuf.length !== input.prefix.length / 2) {
         throw new Error("Length mismatch, is prefix all hex?")
      }
      const suffixBuf: Buffer<ArrayBuffer> = Buffer.from(input.suffix, "hex")
      if (suffixBuf.length !== input.suffix.length / 2) {
         throw new Error("Length mismatch, is suffix all hex?")
      }
   }

   toSeedModel(input: IHexSeed): ReturnableSeedType {
      const prefixBuf: Buffer<ArrayBuffer> = Buffer.from(input.prefix, "hex")
      const suffixBuf: Buffer<ArrayBuffer> = Buffer.from(input.suffix, "hex")
      const prefix = Uint8Array.from(prefixBuf)
      const suffix = Uint8Array.from(suffixBuf)
      return {
         type: "PrefixSuffix",
         prefix,
         suffix,
      }
   }
}
