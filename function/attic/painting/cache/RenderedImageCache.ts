import { Injectable, Logger } from "@nestjs/common"
import { LRUCache } from "lru-cache"
import type { LRUCache as LRUCacheType } from "lru-cache"
import { ULIDString } from "../../../src/messages/interface/NamedValues.js"

/**
 * Cached rendered image data.
 *
 * Holds PNG buffer in memory after rendering completes, allowing the user
 * to analyze/retrieve the image without the BullMQ worker needing to keep
 * it alive. The worker can complete and release resources while the image
 * remains accessible in this cache.
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
    * When this entry was cached (for staleness tracking)
    */
   cachedAt: Date

   /**
    * Optional metadata about where this image was staged/stored
    */
   stagedLocation?: {
      s3Uri?: string
      localPath?: string
      primaryPath: string
   }
}

/**
 * Configuration options for RenderedImageCache
 */
export interface RenderedImageCacheOptions {
   /**
    * Maximum number of cached rendered images
    * Default: 100 images
    */
   maxEntries?: number

   /**
    * Maximum total cache size in bytes (based on buffer.length)
    * Default: 200MB to hold rendered images temporarily
    */
   maxSizeBytes?: number

   /**
    * Default TTL in milliseconds
    * Default: 5 minutes (300000ms) - reasonable window for user analysis
    */
   defaultTtl?: number

   /**
    * Optional LRU cache instance (for testing/mocking)
    * If not provided, creates a new LRUCache instance
    */
   cacheInstance?: LRUCacheType<ULIDString, CachedRenderedImage>
}

/**
 * LRU cache for rendered image buffers.
 *
 * **Purpose**: Decouple worker lifecycle from image data retention.
 *
 * **Problem**: BullMQ workers complete jobs and release resources. If the user
 * wants to retrieve/analyze the rendered image after the job completes, the
 * worker would need to keep the buffer in memory or the user would need to
 * fetch from S3/local storage.
 *
 * **Solution**: Cache rendered buffers by taskId in memory with TTL. Workers
 * store the buffer here after rendering, complete the job, and release. User
 * can retrieve the buffer from cache for analysis without hitting storage.
 *
 * **Usage Pattern**:
 * 1. Worker renders image → stores in cache by taskId
 * 2. Worker completes job and terminates
 * 3. User requests image by taskId → cache returns buffer (if still present)
 * 4. If cache miss → user falls back to S3/local storage
 * 5. Cache evicts entries after TTL or when memory limit reached
 *
 * **Key**: Task ULID (not content hash) - each task has unique buffer to cache
 */
@Injectable()
export class RenderedImageCache {
   private readonly logger: Logger
   private readonly cache: LRUCacheType<ULIDString, CachedRenderedImage>

   constructor(options: RenderedImageCacheOptions = {}, logger?: Logger) {
      this.logger = logger ?? new Logger(RenderedImageCache.name)

      // Use provided cache instance (for testing) or create new one
      if (options.cacheInstance) {
         this.cache = options.cacheInstance
         this.logger.log(
            "RenderedImageCache initialized with provided cache instance",
         )
      } else {
         this.cache = this.createDefaultCache(options)
         this.logger.log(
            `RenderedImageCache initialized: ` +
               `maxEntries=${options.maxEntries ?? 100}, ` +
               `maxSize=${((options.maxSizeBytes ?? 200 * 1024 * 1024) / 1024 / 1024).toFixed(0)}MB, ` +
               `ttl=${((options.defaultTtl ?? 300000) / 1000 / 60).toFixed(1)}min`,
         )
      }
   }

   /**
    * Create default LRUCache instance with standard configuration.
    * Extracted as a method to allow subclass overrides if needed.
    */
   private createDefaultCache(
      options: RenderedImageCacheOptions,
   ): LRUCacheType<ULIDString, CachedRenderedImage> {
      return new LRUCache<ULIDString, CachedRenderedImage>({
         max: options.maxEntries ?? 100,
         maxSize: options.maxSizeBytes ?? 200 * 1024 * 1024, // 200MB default
         ttl: options.defaultTtl ?? 5 * 60 * 1000, // 5 minutes default

         // Calculate size based on actual buffer length
         sizeCalculation: (value) => {
            return value.buffer.length
         },

         // Log evictions for debugging
         dispose: (value, key, reason) => {
            const sizeMB = (value.buffer.length / 1024 / 1024).toFixed(2)
            const age = Date.now() - value.cachedAt.getTime()
            const ageMinutes = (age / 1000 / 60).toFixed(1)

            this.logger.debug(
               `Cache evicted: ${key} (${sizeMB}MB, age=${ageMinutes}min, reason=${reason})`,
            )
         },

         // Allow fetching without updating LRU position for read-only access
         updateAgeOnGet: false,
      })
   }

   /**
    * Store a rendered image in cache by task ID.
    *
    * Called by worker after rendering completes.
    *
    * @param taskId Task ULID
    * @param buffer Rendered PNG buffer
    * @param width Image width
    * @param height Image height
    * @param stagedLocation Optional storage locations
    * @param ttl Optional TTL override (ms)
    */
   set(
      taskId: ULIDString,
      buffer: Buffer,
      width: number,
      height: number,
      stagedLocation?: {
         s3Uri?: string
         localPath?: string
         primaryPath: string
      },
      ttl?: number,
   ): void {
      const entry: CachedRenderedImage = {
         buffer,
         width,
         height,
         cachedAt: new Date(),
         stagedLocation,
      }

      const sizeMB = (buffer.length / 1024 / 1024).toFixed(2)
      this.cache.set(taskId, entry, { ttl })

      this.logger.debug(
         `Cached rendered image: ${taskId} (${sizeMB}MB, ${width}x${height})`,
      )
   }

   /**
    * Retrieve a cached rendered image by task ID.
    *
    * Called by user/API to get the image buffer for analysis.
    *
    * @param taskId Task ULID
    * @returns Cached image if present, undefined if evicted/expired
    */
   get(taskId: ULIDString): CachedRenderedImage | undefined {
      const cached = this.cache.get(taskId)

      if (cached !== undefined) {
         const sizeMB = (cached.buffer.length / 1024 / 1024).toFixed(2)
         const age = Date.now() - cached.cachedAt.getTime()
         const ageSeconds = (age / 1000).toFixed(1)

         this.logger.debug(
            `Cache HIT: ${taskId} (${sizeMB}MB, age=${ageSeconds}s)`,
         )
      } else {
         this.logger.debug(`Cache MISS: ${taskId}`)
      }

      return cached
   }

   /**
    * Check if a task's image is still in cache without retrieving it.
    *
    * @param taskId Task ULID
    * @returns True if cached, false if evicted/expired
    */
   has(taskId: ULIDString): boolean {
      return this.cache.has(taskId)
   }

   /**
    * Explicitly remove a task's image from cache.
    *
    * Useful when user explicitly deletes/dismisses the image.
    *
    * @param taskId Task ULID
    * @returns True if was cached and removed, false if not in cache
    */
   delete(taskId: ULIDString): boolean {
      const deleted = this.cache.delete(taskId)
      if (deleted) {
         this.logger.debug(`Cache deleted: ${taskId}`)
      }
      return deleted
   }

   /**
    * Clear all cached images.
    */
   clear(): void {
      this.cache.clear()
      this.logger.log("Cache cleared")
   }

   /**
    * Get cache statistics.
    */
   getStats() {
      const totalSizeMB = (this.cache.calculatedSize ?? 0) / 1024 / 1024
      const maxSizeMB = (this.cache.maxSize ?? 0) / 1024 / 1024

      return {
         size: this.cache.size,
         maxEntries: this.cache.max,
         totalSizeMB: totalSizeMB.toFixed(2),
         maxSizeMB: maxSizeMB.toFixed(0),
         utilizationPercent: ((totalSizeMB / maxSizeMB) * 100).toFixed(1),
      }
   }

   /**
    * Get list of all cached task IDs.
    *
    * Useful for debugging or UI display of available images.
    */
   getCachedTaskIds(): ULIDString[] {
      return Array.from(this.cache.keys())
   }
}
