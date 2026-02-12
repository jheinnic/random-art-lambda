import { ItemContext } from "../types/ItemContext.js"
import {
   CachedRenderedImage,
   RenderedImageCache,
} from "../../cache/RenderedImageCache.js"
import { ULIDString } from "../../../messages/interface/NamedValues.js"

/**
 * Expression functions for accessing cached rendered images.
 *
 * These functions allow middleware (especially post-rendering middleware)
 * to check cache status and make decisions based on whether data is cached.
 *
 * **Usage**: Inject as custom functions into FileNameResolverMiddleware
 * or other expression-based middleware.
 *
 * @example
 * // In expression evaluator setup:
 * const cacheAccessFns = createCacheAccessFunctions(imageCache)
 * const evaluator = new SimpleExpressionEvaluator()
 *
 * // In filename expression:
 * filenameExpression: "`${isCached() ? 'cached' : 'fresh'}/${contentHash(12)}.png`"
 * // Result: "cached/XyZ_AbC12345.png" or "fresh/XyZ_AbC12345.png"
 */

/**
 * Create cache access functions bound to a RenderedImageCache instance.
 *
 * @param cache The RenderedImageCache to query
 * @returns Object with cache access functions
 */
export class CacheAccessFunctions {
   context: { cache: RenderedImageCache; jobId: ULIDString }

   constructor(context: { cache: RenderedImageCache; jobId: ULIDString }) {
      this.context = Object.assign({}, context)
   }

   /**
    * Check if the current task's image is in cache.
    *
    * @example
    * isCached()  // Returns true/false
    */
   isCached(): boolean {
      return this.context.cache.has(this.context.jobId)
   }

   /**
    * Get the age of the cached image in seconds.
    *
    * @returns Age in seconds, or -1 if not cached
    *
    * @example
    * cacheAge()  // Returns 45 (cached 45 seconds ago)
    * cacheAge()  // Returns -1 (not cached)
    */
   cacheAge(): number {
      const cached: CachedRenderedImage | undefined = this.context.cache.get(
         this.context.jobId,
      )
      if (cached == null) {
         return -1
      }

      const ageMs = Date.now() - cached.cachedAt.getTime()
      return Math.floor(ageMs / 1000)
   }

   /**
    * Get the size of the cached image in megabytes.
    *
    * @returns Size in MB, or -1 if not cached
    *
    * @example
    * cacheSize()  // Returns 2.45 (2.45MB)
    * cacheSize()  // Returns -1 (not cached)
    */
   cacheSize(): number {
      const cached: CachedRenderedImage | undefined = this.context.cache.get(
         this.context.jobId,
      )
      if (cached == null) {
         return -1
      }

      return cached.buffer.length / 1024 / 1024
   }

   /**
    * Get the staged location from cache metadata.
    *
    * Useful for avoiding storage middleware if already staged.
    *
    * @returns Staged path or undefined
    *
    * @example
    * cachedStagedPath()  // Returns "s3://bucket/key.png"
    * cachedStagedPath()  // Returns undefined (not cached or not staged)
    */
   cachedStagedPath(): string | undefined {
      const cached: CachedRenderedImage | undefined = this.context.cache.get(
         this.context.jobId,
      )
      return cached?.stagedLocation?.primaryPath
   }

   /**
    * Get cache statistics for monitoring/debugging.
    *
    * @returns Object with cache stats
    *
    * @example
    * cacheStats()
    * // { size: 47, maxEntries: 100, totalSizeMB: "94.23", ... }
    */
   cacheStats(): Record<string, any> {
      return this.context.cache.getStats()
   }
}

/**
 * Type definition for cache access functions.
 * Use this when configuring middleware with custom functions.
 */
