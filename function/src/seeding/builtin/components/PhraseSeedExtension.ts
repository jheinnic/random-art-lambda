import {
   GEN_MODEL_SEED_EXTENSION_POINT,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "../../kinds/Constants.js"
import {
   PHRASE_SEED_EXTENSION_ID,
   PHRASE_SEED_EXTENSION_ID_STR,
} from "../kinds/Constants.js"
import { IGenModelSeedExtension } from "../../interface/IGenModelSeedExtension.js"
import { IPhraseSeed } from "../interface/IPhraseSeed.js"
import { SeedByExtension } from "../../models/SeedByExtension.js"
import { PaintableSeed } from "../../models/PaintableSeed.js"
import { Logger } from "@nestjs/common"

export class PhraseSeedExtension
   implements IGenModelSeedExtension<PHRASE_SEED_EXTENSION_ID>
{
   static readonly extensionFor: GEN_MODEL_SEED_EXTENSION_POINT =
      GEN_MODEL_SEED_EXTENSION_POINT_STRING

   static readonly extensionId: PHRASE_SEED_EXTENSION_ID =
      PHRASE_SEED_EXTENSION_ID_STR

   static readonly seedModelType: IPhraseSeed = {} as unknown as IPhraseSeed

   private readonly logger: Logger = new Logger("PhraseSeedExtractor")

   readonly extensionId: PHRASE_SEED_EXTENSION_ID = PHRASE_SEED_EXTENSION_ID_STR
   validate(
      input: SeedByExtension<KnownGenModelSeedURIs>,
   ): input is IPhraseSeed {
      if (input.seedKey !== PhraseSeedExtension.extensionId) {
         this.logger.error(
            `${input.seedKey} would not match ${PhraseSeedExtension.extensionId}`,
         )
         return false
      }
      // TODO: Ensure prefix and suffix strings are both in hex
      const castInput: GenModelSeedKind<PHRASE_SEED_EXTENSION_ID> =
         input as GenModelSeedKind<PHRASE_SEED_EXTENSION_ID>
      if (castInput.phrase.length <= 0) {
         // throw new Error("Length mismatch, is prefix all hex?")
         return false
      }

      return true
   }

   toSeedModel(input: SeedByExtension<KnownGenModelSeedURIs>): PaintableSeed {
      if (!this.validate(input)) {
         throw new Error(`Incompatible seed model of type ${input.seedKey}`)
      }

      return {
         seedKey: "SinglePhrase",
         phrase: input.phrase,
      }
   }
}
