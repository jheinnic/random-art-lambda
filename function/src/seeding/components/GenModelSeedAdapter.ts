import { Type } from "@nestjs/common"
import { Observable, of, from, map } from "rxjs"

import {
   PhrasePair,
   PrefixSuffix,
   SeedType,
   SinglePhrase,
} from "../interface/SeedTypes.js"
import { SeedTypeByExtension } from "../interface/SeedTypeByExtension.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import {
   GenModel,
   newPicture,
   oldPicture,
   substringChars,
} from "../../painting/components/genjs6.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "../interface/SeedTypeExtensionPoint.js"
import { IExtensionClass } from "../../extensions/interface/IExtension.js"
import { string } from "zod"
import { IHexSeed } from "../builtin/interface/IHexSeed.js"

function isSyncValue(
   seedOut:
      | SeedType
      | Iterable<SeedType>
      | Promise<SeedType>
      | AsyncIterable<SeedType>,
): seedOut is SinglePhrase | PhrasePair | PrefixSuffix {
   if ("phrase" in seedOut || "prefix" in seedOut) {
      return true
   }
   return false
}

function valueToGenModel(
   seedOut: PrefixSuffix | SinglePhrase | PhrasePair,
): GenModel {
   if (isSinglePhrase(seedOut)) {
      return oldPicture(seedOut.phrase)
   } else if (isPrefixSuffix(seedOut)) {
      return newPicture([...seedOut.prefix], [...seedOut.suffix])
   }
   return newPicture(
      substringChars(seedOut.prefix, 0, seedOut.prefix.length),
      substringChars(seedOut.suffix, 0, seedOut.prefix.length),
   )
}

function isSinglePhrase(
   seed: PrefixSuffix | SinglePhrase | PhrasePair,
): seed is SinglePhrase {
   return !("suffix" in seed)
}

function isPrefixSuffix(
   seed: PrefixSuffix | SinglePhrase | PhrasePair,
): seed is PrefixSuffix {
   if ("suffix" in seed) {
      if (typeof seed.suffix !== "string") {
         return true
      }
   }
   return false
}

export class GenModelSeedAdapter {
   private readonly txFn: InstanceType<typeof this.TClass> // This still correctly resolves to IGenModelSeedExtension<ExtensionId>

   public constructor(
      private readonly extensionId: string,
      private readonly TClass: IExtensionClass<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         typeof extensionId,
         IGenModelSeedExtension<typeof extensionId>,
         []
      >, // Cleanly typed as TClass
      txFnInstance: InstanceType<typeof TClass>,
   ) {
      this.txFn = txFnInstance
   }

   public toModel(
      seed: SeedTypeByExtension<typeof this.extensionId>,
   ): Observable<GenModel> {
      this.txFn.validate(seed)
      const seedOut:
         | SeedType
         | Promise<SeedType>
         | Iterable<SeedType>
         | AsyncIterable<SeedType> = this.txFn.toSeedModel(seed)
      if (isSyncValue(seedOut)) {
         return of(valueToGenModel(seedOut))
      }
      return from(seedOut).pipe(map(valueToGenModel))
   }
}
