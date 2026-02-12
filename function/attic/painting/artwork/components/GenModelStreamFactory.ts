// SHELVED: This file depends on seeding models which have been moved to attic/
// If needed in future, models can be restored from attic/ or reimplemented
// This entire file has been commented out since it's not currently used.

/*
import { map, Observable } from "rxjs"
import {
   PaintableSeed,
   PrefixSuffix,
   SinglePhrase,
} from "../../seeding/models/PaintableSeed.js"
import { GenModel, newPicture, oldPicture, substringChars } from "./genjs6.js"
import { IGenModelStreamFactory as IGenModelStreamHelper } from "../interface/IGenModelStreamFactory.js"
import { Injectable } from "@nestjs/common"
import { PaintingTask } from "../../seeding/models/PaintingTask.js"

function valueToGenModel(seedOut: PaintingTask): GenModel {
   if (isSinglePhrase(seedOut.plotModelSeed)) {
      return oldPicture(seedOut.plotModelSeed.phrase)
   } else if (isPrefixSuffix(seedOut.plotModelSeed)) {
      return newPicture(
         seedOut.plotModelSeed.prefix,
         seedOut.plotModelSeed.suffix,
      )
   }
   return newPicture(
      substringChars(
         seedOut.plotModelSeed.prefix,
         0,
         seedOut.plotModelSeed.prefix.length,
      ),
      substringChars(
         seedOut.plotModelSeed.suffix,
         0,
         seedOut.plotModelSeed.suffix.length,
      ),
   )
}

function isSinglePhrase(seed: PaintableSeed): seed is SinglePhrase {
   return "phrase" in seed
}

function isPrefixSuffix(seed: PaintableSeed): seed is PrefixSuffix {
   if ("suffix" in seed) {
      if (typeof seed.suffix !== "string") {
         return true
      }
   }
   return false
}

@Injectable()
export class GenModelStreamHelper implements IGenModelStreamHelper {
   adapt(source: Observable<PaintingTask>): Observable<GenModel> {
      return source.pipe(map(valueToGenModel))
   }
}
*/
