import { Logger } from "@nestjs/common"

import { KnownGenModelSeedExtensionIds } from "../kinds/GenModelSeedKind.js"

import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

import { IGMSeedExtPayload } from "../interface/index.js"
import { IGMSeedAdapter } from "../interface/IGMSeedAdapter.js"

export class GenModelSeedAdapter<
   ExtensionId extends KnownGenModelSeedExtensionIds,
> implements IGMSeedAdapter<ExtensionId>
{
   private readonly logger: Logger

   public constructor(
      private readonly extensionId: ExtensionId,
      private readonly txFn: IGMSeedExtPayload<ExtensionId>,
   ) {
      this.logger = new Logger(`GenModelSeedAdapter<${this.extensionId}>`)
   }

   public toPaintable(seed: SeedByExtension<ExtensionId>): PaintableSeed {
      if (seed.seedKey !== this.extensionId) {
         throw new Error(
            `Given seed object is for extension ${seed.seedKey}, not ${this.extensionId}`,
         )
      }
      if (this.txFn.validate(seed)) {
         return this.txFn.toSeedModel(seed)
      }
      this.logger.error(this.txFn)
      this.logger.error(this.extensionId)
      this.logger.error(seed)
      throw new Error("Extension unable to validate seed")
   }
}
