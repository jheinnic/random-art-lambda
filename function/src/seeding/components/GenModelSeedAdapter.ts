import { Observable, of, from } from "rxjs"

// import "../di/Module.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "../kinds/Constants.js"
import { ExtensionPayloadKind } from "../../extensions/kinds/index.js"
import { KnownGenModelSeedURIs } from "../kinds/SeedModelKind._st"
import { SeedByExtension } from "../models/SeedByExtension.js"
import { Logger } from "@nestjs/common"

function isSyncValue(seedOut: PaintableSeed): seedOut is PaintableSeed {
   if ("phrase" in seedOut || "prefix" in seedOut) {
      return true
   }
   return false
}

export class GenModelSeedAdapter<ExtensionId extends string> {
   private readonly logger: Logger

   public constructor(
      private readonly extensionId: ExtensionId,
      private readonly txFn: ExtensionPayloadKind<
         GEN_MODEL_SEED_EXTENSION_POINT,
         typeof extensionId
      >,
   ) {
      this.logger = new Logger(`GenModelSeedAdapter<${this.extensionId}>`)
   }

   public toModel(
      seed: SeedByExtension<ExtensionId>,
   ): Observable<PaintableSeed> {
      if (seed.seedKey !== this.extensionId) {
         throw new Error(
            `Given seed object is for extension ${seed.seedKey}, not ${this.extensionId}`,
         )
      }
      if (this.txFn.validate(seed)) {
         const seedOut: PaintableSeed = this.txFn.toSeedModel(seed)
         if (isSyncValue(seedOut)) {
            // return of(valueToGenModel(seedOut))
            return of(seedOut)
         }
         // return from(seedOut).pipe(map(valueToGenModel))
         return from(seedOut)
      }
      this.logger.error(this.txFn)
      this.logger.error(this.extensionId)
      this.logger.error(seed)
      throw new Error("Wrong extension found for seed")
   }
}
