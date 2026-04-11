import { Logger } from "@nestjs/common"
import {
   MiddlewareHandler,
   MiddlewareResult,
   Parser,
} from "../config/MiddlewareConfigTypes.js"
import { ItemContext } from "../types/ItemContext.js"
import { JobDisposition } from "../types/JobDisposition.js"

/**
 * Legacy middleware that filters images based on buffer size.
 *
 * Sets IGNORE disposition if image is too small or too large.
 *
 * @deprecated Use FilterByMiddleware with buffer.length expression instead:
 *   `"buffer.length >= 1000 && buffer.length <= 5000000"`
 */
export class ContentSizeFilterMiddleware
   implements MiddlewareHandler<{}, undefined>
{
   private readonly minSize?: number
   private readonly maxSize?: number
   private readonly isFatal: boolean

   constructor(
      params: {
         minSize?: number
         maxSize?: number
         isFatal?: boolean
      },
      private readonly logger: Logger,
   ) {
      this.minSize = params.minSize
      this.maxSize = params.maxSize
      this.isFatal = params.isFatal ?? false

      if (
         this.minSize !== undefined &&
         (Number.isNaN(this.minSize) ||
            this.minSize === null ||
            this.minSize < 0)
      ) {
         throw new Error(
            "Min size, if defined, must not be NaN, null, or negative",
         )
      }
      if (
         this.maxSize !== undefined &&
         (Number.isNaN(this.maxSize) ||
            this.maxSize === null ||
            this.maxSize <= 0)
      ) {
         throw new Error(
            "Max size, if defined, must not be NaN, null, or non-positive",
         )
      }
      if (
         this.minSize !== undefined &&
         this.maxSize !== undefined &&
         this.minSize > this.maxSize
      ) {
         throw new Error("minSize must be <= maxSize if both are defined")
      }
   }

   async handle(
      ctx: ItemContext,
      _parser: Parser,
   ): Promise<MiddlewareResult<{}, undefined>> {
      const size = ctx.buffer.length

      if (this.minSize !== undefined && size < this.minSize) {
         this.logger.log(
            `Image too small: ${size} < ${this.minSize}, marking as IGNORE`,
         )
         return {
            model: {},
            disposition: this.isFatal
               ? JobDisposition.SEMANTIC_ERROR
               : JobDisposition.IGNORE,
            error: new Error(`Image too small: ${size} < ${this.minSize}`),
         }
      }

      if (this.maxSize !== undefined && size > this.maxSize) {
         this.logger.log(
            `Image too large: ${size} > ${this.maxSize}, marking as IGNORE`,
         )
         return {
            model: {},
            disposition: this.isFatal
               ? JobDisposition.SEMANTIC_ERROR
               : JobDisposition.IGNORE,
            error: new Error(`Image too large: ${size} > ${this.maxSize}`),
         }
      }

      this.logger.debug(`Image size ${size} within acceptable range`)
      return {
         model: {},
         disposition: JobDisposition.OK,
      }
   }
}
