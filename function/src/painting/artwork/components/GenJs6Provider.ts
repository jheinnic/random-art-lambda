/**
 * GenJs6Provider - Adapter for the genjs6.js implementation.
 *
 * This provider wraps the original genjs6 OCaml-to-JS compiled code.
 *
 * NOTE: genjs6.js has unknown licensing status. For open-source
 * distribution, use RandomArtProvider instead (MIT licensed).
 *
 * To use this provider:
 * 1. Ensure genjs6.js is present in this directory
 * 2. Configure the DI to inject GenJs6Provider as IGenModelProvider
 */

import { Injectable } from "@nestjs/common"
import type {
   IGenModel,
   IGenModelProvider,
} from "../interface/IGenModelProvider.js"

type GenModel = object
let computePixel: (
   arg0: GenModel,
   arg1: number,
   arg2: number,
) => [number, number, number]
let newPicture: (
   arg0: Uint8ClampedArray<ArrayBufferLike> | Uint8Array<ArrayBufferLike>,
   arg1: Uint8ClampedArray<ArrayBufferLike> | Uint8Array<ArrayBufferLike>,
) => any
let oldPicture: (arg0: string) => any

try {
   ;({ computePixel, newPicture, oldPicture } = await import("./genjs6.js"))
} catch (err) {
   throw new Error("genjs6 not available", { cause: err })
}

/**
 * Wrapper around genjs6 GenModel that implements IGenModel.
 *
 * Exported for use by legacy code that creates GenModel directly.
 */
export class GenJs6Model implements IGenModel {
   constructor(private readonly model: GenModel) {}

   computePixel(x: number, y: number): [number, number, number] {
      return computePixel(this.model, x, y)
   }
}

/**
 * Provider implementation using the genjs6.js library.
 */
@Injectable()
export class GenJs6Provider implements IGenModelProvider {
   readonly providerId = "genjs6"

   createModel(
      prefix: Uint8ClampedArray | Uint8Array,
      suffix: Uint8ClampedArray | Uint8Array,
   ): IGenModel {
      const model = newPicture(prefix, suffix)
      return new GenJs6Model(model)
   }

   createModelFromPhrase(phrase: string): IGenModel {
      const model = oldPicture(phrase)
      return new GenJs6Model(model)
   }
}
