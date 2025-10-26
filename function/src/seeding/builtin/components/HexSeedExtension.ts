import {
   GEN_MODEL_SEED_EXTENSION_POINT,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "../../kinds/Constants.js"
import {
   HEX_SEED_EXTENSION_ID,
   HEX_SEED_EXTENSION_ID_STR,
} from "../kinds/Constants.js"
import { GenModelSeedKind } from "../../kinds/SeedModelKind.js"
import { KnownExtensionClassIds } from "../../../extensions/kinds/ExtensionClassKind.js"
import { PaintableSeed } from "../../models/PaintableSeed.js"
import { SeedByExtension } from "../../models/SeedByExtension.js"
import { IHexSeed } from "../interface/IHexSeed.js"
import { IGenModelSeedExtension } from "../../interface/IGenModelSeedExtension.js"

export class HexSeedExtension
   implements IGenModelSeedExtension<HEX_SEED_EXTENSION_ID>
{
   static readonly extensionFor: GEN_MODEL_SEED_EXTENSION_POINT =
      GEN_MODEL_SEED_EXTENSION_POINT_STRING

   static readonly extensionId: HEX_SEED_EXTENSION_ID =
      HEX_SEED_EXTENSION_ID_STR

   static readonly SeedModel: IHexSeed = {} as unknown as IHexSeed

   get extensionId(): HEX_SEED_EXTENSION_ID {
      return HexSeedExtension.extensionId
   }

   validate(
      input: SeedByExtension<
         KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>
      >,
   ): input is IHexSeed {
      if (input.seedKey !== HexSeedExtension.extensionId) {
         return false
      }
      const castIt: GenModelSeedKind<HEX_SEED_EXTENSION_ID> =
         input as GenModelSeedKind<HEX_SEED_EXTENSION_ID>
      const prefixBuf: Buffer<ArrayBuffer> = Buffer.from(castIt.prefix, "hex")
      if (prefixBuf.length !== castIt.prefix.length / 2) {
         // throw new Error("Length mismatch, is prefix all hex?")
         return false
      }
      const suffixBuf: Buffer<ArrayBuffer> = Buffer.from(castIt.suffix, "hex")
      if (suffixBuf.length !== castIt.suffix.length / 2) {
         // throw new Error("Length mismatch, is suffix all hex?")
         return false
      }

      return true
   }

   toSeedModel(
      input: SeedByExtension<
         KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>
      >,
   ): PaintableSeed {
      if (!this.validate(input)) {
         throw new Error(`Incompatible seed model of type: ${input.seedKey}`)
      }

      const prefix = Uint8Array.from(Buffer.from(input.prefix, "hex"))
      const suffix = Uint8Array.from(Buffer.from(input.suffix, "hex"))
      return {
         seedKey: "PrefixSuffix",
         prefix,
         suffix,
      }
   }
}
