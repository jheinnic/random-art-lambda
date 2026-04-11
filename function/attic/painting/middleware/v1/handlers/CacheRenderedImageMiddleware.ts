import { Logger } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareResult } from "../types/MiddlewareResult.js"
import { Parser } from "../expression/Parser.js"
import { ItemContext } from "../types/ItemContext.js"
import { JobDisposition } from "../types/JobDisposition.js"
import { RenderedImageCache } from "../../cache/RenderedImageCache.js"
import { ULIDString } from "../../../messages/interface/NamedValues.js"

/**
 * Middleware that caches rendered image buffers for user access.
 *
 * This runs AFTER rendering completes, storing the buffer in an LRU cache
 * so users can retrieve it without requiring the worker to stay alive or
 * fetching from S3/storage.
 *
 * **Position in chain**: Near the END (after rendering, before/after storage)
 *
 * **Purpose**: Decouple worker lifecycle from user data access needs.
 *
 * @example
 * // Middleware chain order:
 * [
 *   NameByMiddleware,               // Generate filename
 *   FilterByMiddleware,             // Filter by size
 *   FileStoreMiddleware,            // Store to S3
 *   CacheRenderedImageMiddleware,   // Cache for user access ← HERE
 * ]
 */
export class CacheRenderedImageMiddleware
   implements MiddlewareHandler<{}, undefined>
{
   constructor(
      private readonly params: {
         /**
          * Whether to enable caching (allows runtime toggle)
          */
         enabled?: boolean

         /**
          * Optional TTL override in milliseconds
          * If not provided, uses cache's default TTL
          */
         ttl?: number
      },
      private readonly logger: Logger,
      private readonly imageCache: RenderedImageCache,
   ) {}

   async handle(
      ctx: ItemContext,
      _parser: Parser,
   ): Promise<MiddlewareResult<{}, undefined>> {
      if (this.params.enabled === false) {
         this.logger.debug("Caching disabled, skipping")
         return {
            model: {},
            disposition: JobDisposition.OK,
         }
      }

      // Only cache if we have a buffer
      if (!ctx.buffer) {
         this.logger.warn("No buffer in context, cannot cache")
         return {
            model: {},
            disposition: JobDisposition.OK,
         }
      }

      // Extract staging location if available (from prior middleware)
      const stagedLocation = this.extractStagedLocation(ctx)

      // Cache the rendered image
      this.imageCache.set(
         ctx.jobId as ULIDString,
         ctx.buffer,
         ctx.metadata.width,
         ctx.metadata.height,
         stagedLocation,
         this.params.ttl,
      )

      this.logger.log(
         `Cached rendered image for task ${ctx.jobId} ` +
            `(${ctx.metadata.width}x${ctx.metadata.height})`,
      )

      return {
         model: {},
         disposition: JobDisposition.OK,
      }
   }

   /**
    * Extract staged location from context (set by storage middleware)
    */
   private extractStagedLocation(ctx: ItemContext):
      | {
           s3Uri?: string
           localPath?: string
           primaryPath: string
        }
      | undefined {
      const s3Uri = ctx.customData?.s3Uri
      const localPath = ctx.customData?.localPath
      const primaryPath = s3Uri || localPath

      if (!primaryPath) {
         return undefined
      }

      return {
         s3Uri,
         localPath,
         primaryPath,
      }
   }
}
