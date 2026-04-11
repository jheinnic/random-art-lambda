/**
 * RandomArtProvider - Adapter for the vshymanskyy/randomart implementation.
 *
 * This provider wraps the MIT-licensed randomart library for open-source
 * distribution. It generates art through mathematical expression trees.
 *
 * @see https://github.com/vshymanskyy/randomart
 */

import { Injectable } from "@nestjs/common"
import type {
   IGenModel,
   IGenModelProvider,
} from "../interface/IGenModelProvider.js"
import { generate } from "./randomart/randomart.js"
import {
   getEvaluator,
   type EvaluatorFunction,
} from "./randomart/randomart-eval.js"

/**
 * Wrapper around randomart evaluator that implements IGenModel.
 *
 * The randomart library outputs colors in range [-1, 1].
 * This wrapper scales them to [0, 255] for compatibility with the painting system.
 */
class RandomArtModel implements IGenModel {
   private readonly evaluator: EvaluatorFunction

   constructor(formula: string) {
      this.evaluator = getEvaluator(formula)
   }

   computePixel(x: number, y: number): [number, number, number] {
      // Evaluate the formula at (x, y) - returns values in range [-1, 1]
      const [r, g, b] = this.evaluator(x, y)

      // Scale from [-1, 1] to [0, 255]
      // Using the same formula as randomart-eval.js: (val + 1) * 128
      // Clamp to ensure we stay in valid range
      return [
         Math.max(0, Math.min(255, Math.round((r + 1) * 128))),
         Math.max(0, Math.min(255, Math.round((g + 1) * 128))),
         Math.max(0, Math.min(255, Math.round((b + 1) * 128))),
      ]
   }
}

/**
 * Provider implementation using the vshymanskyy/randomart library.
 *
 * This is the preferred provider for open-source distribution due to
 * its MIT license.
 */
@Injectable()
export class RandomArtProvider implements IGenModelProvider {
   readonly providerId = "randomart"

   createModel(
      prefix: Uint8ClampedArray | Uint8Array,
      suffix: Uint8ClampedArray | Uint8Array,
   ): IGenModel {
      // Combine prefix and suffix bytes into a seed string
      // Convert bytes to a hex string for consistent seeding
      const seed = this.bytesToSeed(prefix, suffix)

      // Generate the expression tree
      const expressionTree = generate(seed)

      // Convert to formula string and create evaluator
      const formula = expressionTree.toString()

      return new RandomArtModel(formula)
   }

   createModelFromPhrase(phrase: string): IGenModel {
      // Use the phrase directly as the seed
      const expressionTree = generate(phrase)
      const formula = expressionTree.toString()
      return new RandomArtModel(formula)
   }

   /**
    * Convert byte arrays to a consistent seed string.
    *
    * Uses hex encoding to preserve all byte values and create
    * a deterministic string from the binary seed data.
    */
   private bytesToSeed(
      prefix: Uint8ClampedArray | Uint8Array,
      suffix: Uint8ClampedArray | Uint8Array,
   ): string {
      const hexChars = "0123456789abcdef"
      let seed = ""

      // Convert prefix bytes to hex
      for (let i = 0; i < prefix.length; i++) {
         const byte = prefix[i]
         seed += hexChars[(byte >> 4) & 0xf]
         seed += hexChars[byte & 0xf]
      }

      // Add separator to distinguish prefix from suffix
      seed += "-"

      // Convert suffix bytes to hex
      for (let i = 0; i < suffix.length; i++) {
         const byte = suffix[i]
         seed += hexChars[(byte >> 4) & 0xf]
         seed += hexChars[byte & 0xf]
      }

      return seed
   }
}
