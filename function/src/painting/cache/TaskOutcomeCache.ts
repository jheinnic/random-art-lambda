import { Injectable, Logger } from "@nestjs/common"
import { LRUCache } from "lru-cache"
import { SinglePaintingTaskRequest } from "../messages/dto/SinglePaintingTaskRequest.js"
import * as crypto from "crypto"

/**
 * Cached rendered image data.
 *
 * This holds the actual PNG buffer in memory to avoid re-rendering
 * identical tasks. The buffer can then be used to generate the
 * TaskResultRecord/report without rendering.
 */
export interface CachedRenderedImage {
   /**
    * The rendered PNG image buffer
    */
   buffer: Buffer

   /**
    * Image dimensions
    */
   width: number
   height: number

   /**
    * When this cache entry was created
    */
   cachedAt: Date

   /**
    * TTL for this entry (in ms)
    */
   ttl?: number

   /**
    * Original request that produced this result (for validation)
    */
   request: SinglePaintingTaskRequest<any>
}

/**
 * Configuration options for TaskOutcomeCache
 */
export interface TaskOutcomeCacheOptions {
   /**
    * Maximum number of cached rendered images
    */
   maxEntries?: number

   /**
    * Maximum total cache size in bytes (based on buffer.length)
    * Default: 100MB to hold ~50-100 typical PNG images in memory
    */
   maxSizeBytes?: number

   /**
    * Default TTL in milliseconds (undefined = no expiration)
    */
   defaultTtl?: number

   /**
    * Cache key strategy
    * - taskId: Cache by task ULID (simple but no dedup)
    * - contentHash: Cache by hash of inputs (true dedup, RECOMMENDED)
    * - bufferHash: Cache by hash of rendered buffer (dedup by content)
    */
   keyStrategy?: "taskId" | "contentHash" | "bufferHash"
}

/**
 * LRU cache for rendered image buffers.
 *
 * Caches PNG Buffer data in memory to avoid re-rendering identical tasks.
 * The cached buffer can be reused to generate reports/outcomes without
 * invoking the rendering engine.
 *
 * Size management is based on actual buffer.length for accurate memory tracking.
 */
@Injectable()
export class TaskOutcomeCache {
   private readonly logger = new Logger(TaskOutcomeCache.name)
   private readonly cache: LRUCache<string, CachedRenderedImage>
   private readonly keyStrategy: "taskId" | "contentHash" | "bufferHash"

   constructor(options: TaskOutcomeCacheOptions = {}) {
      this.keyStrategy = options.keyStrategy ?? "contentHash"

      this.cache = new LRUCache<string, CachedRenderedImage>({
         max: options.maxEntries ?? 100, // ~100 images default
         maxSize: options.maxSizeBytes ?? 100 * 1024 * 1024, // 100MB default
         ttl: options.defaultTtl, // undefined = no expiration

         // Calculate size based on actual buffer length
         sizeCalculation: (value) => {
            return value.buffer.length
         },

         // Log evictions
         dispose: (value, key, reason) => {
            if (reason === "evict") {
               const sizeMB = (value.buffer.length / 1024 / 1024).toFixed(2)
               this.logger.debug(
                  `Cache evicted: ${key.slice(0, 16)}... (${sizeMB}MB, reason: ${reason})`,
               )
            }
         },
      })

      this.logger.log(
         `TaskOutcomeCache initialized: strategy=${this.keyStrategy}, ` +
            `maxEntries=${options.maxEntries ?? 100}, ` +
            `maxSize=${((options.maxSizeBytes ?? 100 * 1024 * 1024) / 1024 / 1024).toFixed(1)}MB`,
      )
   }

   /**
    * Generate cache key for a task request
    */
   private generateKey(request: SinglePaintingTaskRequest<any>): string {
      switch (this.keyStrategy) {
         case "taskId":
            // taskId strategy not supported - taskId is assigned by framework, not in request
            throw new Error("taskId strategy not supported - use contentHash")

         case "contentHash": {
            // Hash of all input parameters for true deduplication
            const hash = crypto.createHash("sha256")
            hash.update(request.genSeed.seedPrefix)
            hash.update(request.genSeed.seedSuffix)
            hash.update(JSON.stringify(request.plotDataRef))
            // hash.update(JSON.stringify(request.plotDataRef.spatialBoundary))
            // hash.update(JSON.stringify(request.plotDataRef.paintResolution))
            // hash.update(String(request.plotDataRef)) // Convert PlotDataRef to string

            // Include canvas fragment if partial render
            if ("partialSlice" in request) {
               hash.update(JSON.stringify((request as any).partialSlice))
            }

            return hash.digest("hex")
         }

         case "bufferHash":
            // This requires the buffer to exist, so it's only used during set()
            throw new Error(
               "bufferHash strategy requires buffer - use during set()",
            )
      }
   }

   /**
    * Generate cache key from rendered buffer hash
    */
   private generateBufferHashKey(buffer: Buffer): string {
      return crypto.createHash("sha256").update(buffer).digest("base64url")
   }

   /**
    * Check cache for a matching rendered image
    *
    * @param request Task request to check
    * @returns Cached rendered image if found and valid, undefined otherwise
    */
   get(
      request: SinglePaintingTaskRequest<any>,
   ): CachedRenderedImage | undefined {
      if (this.keyStrategy === "bufferHash") {
         // Can't use bufferHash strategy for get - we don't have the buffer yet
         return undefined
      }

      const key = this.generateKey(request)
      const cached = this.cache.get(key)

      if (cached !== undefined) {
         const sizeMB = (cached.buffer.length / 1024 / 1024).toFixed(2)
         this.logger.debug(
            `Cache HIT for key: ${key.slice(0, 16)}... (${sizeMB}MB buffer)`,
         )

         // Validate that request hasn't changed in incompatible ways
         if (!this.validateCachedRequest(request, cached.request)) {
            this.logger.warn(
               `Cache entry invalid - request changed: ${key.slice(0, 16)}...`,
            )
            this.cache.delete(key)
            return undefined
         }
      } else {
         this.logger.debug(`Cache MISS for key: ${key.slice(0, 16)}...`)
      }

      return cached
   }

   /**
    * Store a rendered image in cache
    *
    * @param request Original task request
    * @param buffer Rendered PNG buffer to cache
    * @param width Image width
    * @param height Image height
    * @param ttl Optional TTL override for this entry
    */
   set(
      request: SinglePaintingTaskRequest<any>,
      buffer: Buffer,
      width: number,
      height: number,
      ttl?: number,
   ): void {
      let key: string

      if (this.keyStrategy === "bufferHash") {
         // Use hash of actual rendered content
         key = this.generateBufferHashKey(buffer)
      } else {
         // Use hash of request inputs
         key = this.generateKey(request)
      }

      const entry: CachedRenderedImage = {
         buffer,
         width,
         height,
         request,
         cachedAt: new Date(),
         ttl,
      }

      const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
      this.cache.set(key, entry, { ttl })
      this.logger.debug(
         `Cached rendered image: ${key.slice(0, 16)}... (${sizeMB}MB)`,
      )
   }

   /**
    * Validate that cached request is compatible with new request
    */
   private validateCachedRequest(
      newReq: SinglePaintingTaskRequest<any>,
      cachedReq: SinglePaintingTaskRequest<any>,
   ): boolean {
      // For contentHash strategy, these should always match since they're part of the key
      // But validate anyway for safety.
      // Geometry comparison is unnecessary - CIDs are content-addressed, so matching
      // CIDs guarantee identical geometry.
      return (
         newReq.genSeed.seedPrefix === cachedReq.genSeed.seedPrefix &&
         newReq.genSeed.seedSuffix === cachedReq.genSeed.seedSuffix &&
         newReq.plotDataRef.regionMapCID === cachedReq.plotDataRef.regionMapCID
      )
   }

   /**
    * Clear all cached entries
    */
   clear(): void {
      this.cache.clear()
      this.logger.log("Cache cleared")
   }

   /**
    * Get cache statistics
    */
   getStats() {
      return {
         size: this.cache.size,
         maxSize: this.cache.max,
         calculatedSize: this.cache.calculatedSize,
      }
   }
}
