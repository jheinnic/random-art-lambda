import { Logger } from "@nestjs/common"

import "../kinds/GenModelSeedPlugins.js"
import {
   GEN_MODEL_SEED_EXTENSION_POINT,
   GEN_MODEL_SEED_EXTENSION_POINT_STRING,
} from "../../kinds/Constants.js"
import {
   PHRASE_SEED_EXTENSION_ID,
   PHRASE_SEED_EXTENSION_ID_STR,
} from "../kinds/Constants.js"

import { PaintableSeed } from "../../models/PaintableSeed.js"
import { SeedByExtension } from "../../models/SeedByExtension.js"

import { IGMSeedExtPayload } from "../../interface/IGMSeedExtPayload.js"
import { IPhraseSeed } from "../interface/IPhraseSeed.js"

export class PhraseSeedExtension
   implements IGMSeedExtPayload<PHRASE_SEED_EXTENSION_ID>
{
   static readonly extensionFor: GEN_MODEL_SEED_EXTENSION_POINT =
      GEN_MODEL_SEED_EXTENSION_POINT_STRING

   static readonly extensionId: PHRASE_SEED_EXTENSION_ID =
      PHRASE_SEED_EXTENSION_ID_STR

   get extensionId(): PHRASE_SEED_EXTENSION_ID {
      return PHRASE_SEED_EXTENSION_ID_STR
   }

   validate(input: SeedByExtension<string>): input is IPhraseSeed {
      if (input.seedKey !== PhraseSeedExtension.extensionId) {
         const logger: Logger = new Logger("PhraseSeedGMSeedExtension")
         logger.error(
            `${input.seedKey} would not match ${PhraseSeedExtension.extensionId}`,
         )
         return false
      }
      if (
         !("phrase" in input) ||
         typeof input.phrase !== "string" ||
         input.phrase.length <= 0
      ) {
         return false
      }

      return true
   }

   toSeedModel(input: IPhraseSeed): PaintableSeed {
      // if (!this.validate(input)) {
      // throw new Error(`Incompatible seed model of type ${input.seedKey}`)
      // }

      return {
         seedKey: "SinglePhrase",
         phrase: input.phrase,
      }
   }
}
