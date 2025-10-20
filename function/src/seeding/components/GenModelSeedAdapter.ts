import { Observable, of, from } from "rxjs"

import "../di/Module.js"
import {
   PhrasePair,
   PrefixSuffix,
   ReturnableSeedType,
   SeedType,
   SinglePhrase,
} from "../interface/SeedTypes.js"
// import {
//    GenModel,
//    newPicture,
//    oldPicture,
//    substringChars,
// } from "../../painting/components/genjs6.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "../interface/SeedTypeExtensionPoint.js"
import {
   IExtensionClass,
   KnownExtensionIds,
   PayloadTypeKind,
} from "../../extensions/interface/IExtension.js"
import { SeedModelKind } from "../interface/SeedModelKind.js"

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

// function valueToGenModel(
//    seedOut: PrefixSuffix | SinglePhrase | PhrasePair,
// ): GenModel {
//    if (isSinglePhrase(seedOut)) {
//       return oldPicture(seedOut.phrase)
//    } else if (isPrefixSuffix(seedOut)) {
//       return newPicture([...seedOut.prefix], [...seedOut.suffix])
//    }
//    return newPicture(
//       substringChars(seedOut.prefix, 0, seedOut.prefix.length),
//       substringChars(seedOut.suffix, 0, seedOut.prefix.length),
//    )
// }

// function isSinglePhrase(
//    seed: PrefixSuffix | SinglePhrase | PhrasePair,
// ): seed is SinglePhrase {
//    return !("suffix" in seed)
// }

// function isPrefixSuffix(
//    seed: PrefixSuffix | SinglePhrase | PhrasePair,
// ): seed is PrefixSuffix {
//    if ("suffix" in seed) {
//       if (typeof seed.suffix !== "string") {
//          return true
//       }
//    }
//    return false
// }

export class GenModelSeedAdapter<
   ExtensionId extends KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
> {
   public constructor(
      private readonly _key: ExtensionId,
      private readonly TClass: IExtensionClass<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         ExtensionId
      >,
      private readonly txFn: PayloadTypeKind<
         GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
         ExtensionId
      >,
   ) {
      if (!TClass[Symbol.hasInstance](txFn)) {
         throw new Error(`txFn is not of type ${TClass.name}`)
      }
   }

   public toModel(seed: SeedModelKind<ExtensionId>): Observable<SeedType> {
      if (seed.seedKey !== this.TClass.extensionId) {
         throw new Error(
            `Given seed object is for extension ${seed.seedKey}, not ${this.TClass.extensionId}`,
         )
      }
      this.txFn.validate(seed)
      const seedOut: ReturnableSeedType = this.txFn.toSeedModel(seed)
      if (isSyncValue(seedOut)) {
         // return of(valueToGenModel(seedOut))
         return of(seedOut)
      }
      // return from(seedOut).pipe(map(valueToGenModel))
      return from(seedOut)
   }
}
