import { Observable, of, from, map } from "rxjs"
import {
   GenModel,
   newPicture,
   oldPicture,
   substringChars,
} from "../../painting/components/genjs6.js"
import { IGenModelSeedExtension } from "../interface/IGenModelSeedExtension.js"
import {
   PhrasePair,
   PrefixSuffix,
   SeedType,
   SinglePhrase,
} from "../interface/SeedTypes.js"
import { SeedTypeByExtension } from "../interface/SeedTypeByExtension.js"
import { Type } from "@nestjs/common"
// import { ExtensionAdapter } from "../../modules/interface/ExtensionAdapter.js"

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

export class GenModelSeedAdapter<
   ExtensionId extends string,
   M extends SeedTypeByExtension<ExtensionId>,
> {
   public constructor(
      private readonly extensionFor: ExtensionId,
      private readonly txFnClass: Type<IGenModelSeedExtension<ExtensionId, M>>,
      private readonly txFn: InstanceType<typeof txFnClass>,
   ) {}

   public toModel(seed: M): Observable<GenModel> {
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
