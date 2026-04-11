/**
 * Example: Integrating RenderedImageCache with middleware chain
 *
 * This shows how to use the cache for post-rendering user access.
 */

import { MiddlewareProps } from "./MiddlewareProps.js"
import {
   CacheRenderedImageMiddleware,
   NameByMiddleware,
   FilterByMiddleware,
   FileStoreMiddleware,
} from "../handlers/index.js"
import { RenderedImageCache } from "../../cache/RenderedImageCache.js"
import { createCacheAccessFunctions } from "../expression/CacheAccessFunctions.js"

/**
 * Example middleware configuration WITH cache integration.
 *
 * **Key points**:
 * 1. Cache access functions injected as custom expression functions
 * 2. CacheRenderedImageMiddleware placed AFTER storage (near end of chain)
 * 3. Cache enables expressions like: `isCached() ? 'cached' : 'fresh'`
 */
export function createMiddlewareConfigWithCache(
   imageCache: RenderedImageCache,
): {
   itemChain: Array<MiddlewareProps<any>>
   cacheAccessFunctions: ReturnType<typeof createCacheAccessFunctions>
} {
   // Create cache access functions for expressions
   const cacheAccessFunctions = createCacheAccessFunctions(imageCache)

   const itemChain: Array<MiddlewareProps<any>> = [
      // 1. Generate filename via expression
      {
         middlewareClass: NameByMiddleware,
         valueParams: {
            expression:
               "hash(buffer).slice(0,2) + '/' + hash(buffer).slice(2,14) + '.png'",
            outputProperty: "filename",
         },
         inject: [
            Symbol("ExpressionEvaluator"),
            Symbol("CacheAccessFunctions"),
         ],
      },

      // 2. Filter by size using expression
      {
         middlewareClass: FilterByMiddleware,
         valueParams: {
            expression: "buffer.length >= 1024 && buffer.length <= 10485760",
         },
      },

      // 3. Store to S3 using generic FileStoreMiddleware
      {
         middlewareClass: FileStoreMiddleware,
         valueParams: {
            pathProperty: "filename",
            uriProperty: "s3Uri",
            contentType: "image/png",
         },
         inject: [Symbol("S3FileStore")],
      },

      // 4. Cache rendered image for user access (POST-RENDERING)
      {
         middlewareClass: CacheRenderedImageMiddleware,
         valueParams: {
            enabled: true,
            ttl: 5 * 60 * 1000, // 5 minutes
         },
         inject: [Symbol("imageCache")],
      },
   ]

   return { itemChain, cacheAccessFunctions }
}

/**
 * Example: Using cache in filename expressions
 */
// export const exampleFilenameExpressions = {
//    /**
//     * Include cache status in filename
//     */
//    withCacheStatus: `${isCached() ? "cached" : "fresh"}/${contentHash().slice(0, 12)}.png`,
//    // Result: "cached/XyZ_AbC12345.png" or "fresh/XyZ_AbC12345.png"

//    /**
//     * Use staged path from cache to avoid re-staging
//     */
//    fromCache: "`${cachedStagedPath() || contentHash(12)}.png`",
//    // Result: Uses cached staged path or falls back to hash

//    /**
//     * Include cache age for debugging
//     */
//    withAge: "`img_${cacheAge()}s_${contentHash(8)}.png`",
//    // Result: "img_45s_XyZ_AbC1.png" (cached 45 seconds ago)

//    /**
//     * Conditional naming based on cache size
//     */
//    sizeAware: "`${cacheSize() > 2 ? 'large' : 'small'}/${contentHash(12)}.png`",
//    // Result: "large/XyZ_AbC12345.png" for >2MB images
// }

/**
 * Example: Worker usage
 */
export const workerExample = `
// Worker after rendering:
const { buffer, canvas } = await renderEngine.render(request)

// Create context (with cache access functions available)
const ctx = createItemContextFromRequest(request, buffer, canvas)

// Run middleware chain (includes CacheRenderedImageMiddleware at end)
const result = await itemMiddlewareChain.execute(ctx)

// At this point:
// - Image is stored in S3 (S3StorageHandlerMiddleware)
// - Image is cached in memory (CacheRenderedImageMiddleware)
// - Worker can complete and terminate
// - User can retrieve from cache without S3 fetch

return result
`

/**
 * Example: User/API retrieval
 */
export const userRetrievalExample = `
// User requests image by taskId
const cached = imageCache.get(taskId)

if (cached) {
  // Cache HIT - instant in-memory access
  res.setHeader('X-Cache', 'HIT')
  res.setHeader('Content-Type', 'image/png')
  res.send(cached.buffer)
} else {
  // Cache MISS - fetch from S3 (fallback)
  res.setHeader('X-Cache', 'MISS')
  const buffer = await s3.getObject({ Key: taskId }).promise()
  res.send(buffer.Body)
}
`
