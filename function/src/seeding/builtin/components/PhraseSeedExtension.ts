import {
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING,
} from "../../interface/SeedTypeExtensionPoint"
import {
   PHRASE_SEED_EXTENSION_ID,
   PHRASE_SEED_EXTENSION_ID_STR,
} from "../interface/Constants"
import { IGenModelSeedExtension } from "../../interface/IGenModelSeedExtension.js"
import { IPhraseSeed } from "../interface/IPhraseSeed.js"
import { ReturnableSeedType } from "../../interface/SeedTypes.js"

export class PhraseSeedExtension
   implements IGenModelSeedExtension<PHRASE_SEED_EXTENSION_ID>
{
   static readonly extensionFor: GEN_MODEL_SEED_TYPE_EXTENSION_POINT =
      GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING

   static readonly extensionId: PHRASE_SEED_EXTENSION_ID =
      PHRASE_SEED_EXTENSION_ID_STR

   validate(input: IPhraseSeed): void {
      // TODO: Ensure prefix and suffix strings are both in hex
      if (input.phrase.length > 0) {
         throw new Error("Length mismatch, is prefix all hex?")
      }
   }

   toSeedModel(input: IPhraseSeed): ReturnableSeedType {
      return {
         type: "SinglePhrase",
         phrase: input.phrase,
      }
   }
}
