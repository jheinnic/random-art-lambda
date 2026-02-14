import { Logger } from "@nestjs/common"

import "../kinds/Extension.ts"
import {
   GEN_MODEL_SEED_EXTENSION_POINT,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "../../kinds/Constants.js"
import {
   HEX_SEED_EXTENSION_ID,
   HEX_SEED_EXTENSION_ID_STR,
} from "../kinds/Constants.js"

import { PaintableSeed } from "../../models/PaintableSeed.js"
import { SeedByExtension } from "../../models/SeedByExtension.js"

import { IGMSeedExtPayload } from "../../interface/IGMSeedExtPayload.js"
import { IHexSeed } from "../interface/IHexSeed.js"

export class HexSeedExtension
   implements IGMSeedExtPayload<HEX_SEED_EXTENSION_ID>
{
   static readonly extensionFor: GEN_MODEL_SEED_EXTENSION_POINT =
      GEN_MODEL_SEED_EXTENSION_POINT_STRING

   static readonly extensionId: HEX_SEED_EXTENSION_ID =
      HEX_SEED_EXTENSION_ID_STR

   get extensionId(): HEX_SEED_EXTENSION_ID {
      return HEX_SEED_EXTENSION_ID_STR
   }

   validate(input: SeedByExtension<string>): input is IHexSeed {
      try {
         return (
            input.seedKey === HexSeedExtension.extensionId &&
            "prefix" in input &&
            typeof input.prefix === "string" &&
            Buffer.from(input.prefix, "hex").length ===
               input.prefix.length / 2 &&
            "suffix" in input &&
            typeof input.suffix === "string" &&
            Buffer.from(input.suffix, "hex").length === input.suffix.length / 2
         )
      } catch (e) {
         const logger: Logger = new Logger("HexSeedGMSeedExtension")
         logger.error(`Unexpected error validating ${JSON.stringify(input)}`, e)
      }

      return false
   }

   // oldValidate(input: SeedByExtension<string>): input is IHexSeed {
   //    if (input.seedKey !== this.extensionId) {
   //       return false
   //    }
   //    if (
   //       !("prefix" in input) ||
   //       !("suffix" in input) ||
   //       typeof input.prefix !== "string" ||
   //       typeof input.suffix !== "string"
   //    ) {
   //       return false
   //    }
   //    const prefixBuf: Buffer<ArrayBuffer> = Buffer.from(input.prefix, "hex")
   //    if (prefixBuf.length !== input.prefix.length / 2) {
   //       return false
   //    }
   //    const suffixBuf: Buffer<ArrayBuffer> = Buffer.from(input.suffix, "hex")
   //    if (suffixBuf.length !== input.suffix.length / 2) {
   //       return false
   //    }

   //    return true
   // }

   toSeedModel(input: IHexSeed): PaintableSeed {
      const prefix: Uint8Array<ArrayBuffer> = Uint8Array.from(
         Buffer.from(input.prefix, "hex"),
      )
      const suffix: Uint8Array<ArrayBuffer> = Uint8Array.from(
         Buffer.from(input.suffix, "hex"),
      )
      return {
         seedKey: "PrefixSuffix",
         prefix,
         suffix,
      }
   }
}
