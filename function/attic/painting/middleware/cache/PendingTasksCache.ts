import { Injectable, Logger } from "@nestjs/common"
import { LRUCache } from "lru-cache"
import type { LRUCache as LRUCacheType } from "lru-cache"
import type { PaintTaskId } from "../messages/values/PaintTaskId.js"
import type { PendingTask } from "./PendingTask.js"

/**
 * Configuration options for PendingTasksCache
 */
export interface PendingTasksCacheOptions {
   /**
    * Maximum number of pending tasks to track
    * Default: 1000 tasks
    */
   maxEntries?: number

   /**
    * Default TTL in milliseconds
    * Default: 30 minutes - tasks should complete or fail within this window
    */
   defaultTtl?: number

   /**
    * Optional LRU cache instance (for testing/mocking)
    */
   cacheInstance?: LRUCacheType<PaintTaskId, PendingTask>
}

/**
 * Cache for in-flight painting tasks.
 *
 * **Purpose**: Track the mapping from task ULID to original request data
 * during the fan-out/gather execution flow.
 *
 * **Flow**:
 * 1. Orchestrator receives MultiTaskProjectRequest
 * 2. Orchestrator assigns ULIDs and enqueues jobs to BullMQ
 * 3. Each task is cached here: ULID → PendingTask (original request subgraph)
 * 4. Workers execute and results gather back
 * 5. On gather, lookup by ULID retrieves original context without re-transforming
 * 6. On completion/failure, task is removed from cache
 *
 * This avoids re-computing the request transformation at each hop of the
 * distributed execution.
 */
@Injectable()
export class PendingTasksCache {
   private readonly logger: Logger
   private readonly cache: LRUCacheType<PaintTaskId, PendingTask>

   constructor(options: PendingTasksCacheOptions = {}, logger?: Logger) {
      this.logger = logger ?? new Logger(PendingTasksCache.name)

      if (options.cacheInstance !== undefined) {
         this.cache = options.cacheInstance
         this.logger.log(
            "PendingTasksCache initialized with provided cache instance",
         )
      } else {
         this.cache = this.createDefaultCache(options)
         this.logger.log(
            `PendingTasksCache initialized: ` +
               `maxEntries=${options.maxEntries ?? 1000}, ` +
               `ttl=${((options.defaultTtl ?? 30 * 60 * 1000) / 1000 / 60).toFixed(0)}min`,
         )
      }
   }

   private createDefaultCache(
      options: PendingTasksCacheOptions,
   ): LRUCacheType<PaintTaskId, PendingTask> {
      return new LRUCache<PaintTaskId, PendingTask>({
         max: options.maxEntries ?? 1000,
         ttl: options.defaultTtl ?? 30 * 60 * 1000, // 30 minutes default

         // Log evictions for debugging stale tasks
         dispose: (_value, key, reason) => {
            if (reason === "evict") {
               this.logger.warn(
                  `Pending task expired: ${key} (reason=${reason})`,
               )
            }
         },

         updateAgeOnGet: false,
      })
   }

   /**
    * Register a pending task when it's enqueued.
    *
    * Called by orchestrator after assigning ULID and before enqueueing to BullMQ.
    *
    * @param taskId The assigned task ULID
    * @param task The original task request data
    * @param ttl Optional TTL override (ms)
    */
   set(taskId: PaintTaskId, task: PendingTask, ttl?: number): void {
      this.cache.set(taskId, task, { ttl })
      this.logger.debug(`Registered pending task: ${taskId}`)
   }

   /**
    * Retrieve the original task data by ULID.
    *
    * Called during gather phase to correlate results with original request.
    *
    * @param taskId Task ULID
    * @returns Original task data if still pending, undefined if completed/expired
    */
   get(taskId: PaintTaskId): PendingTask | undefined {
      const task = this.cache.get(taskId)

      if (task !== undefined) {
         this.logger.debug(`Pending task found: ${taskId}`)
      } else {
         this.logger.debug(`Pending task not found: ${taskId}`)
      }

      return task
   }

   /**
    * Check if a task is still pending.
    *
    * @param taskId Task ULID
    */
   has(taskId: PaintTaskId): boolean {
      return this.cache.has(taskId)
   }

   /**
    * Remove a task from pending cache.
    *
    * Called when task completes (success or failure) and is no longer in-flight.
    *
    * @param taskId Task ULID
    * @returns True if was pending and removed
    */
   complete(taskId: PaintTaskId): boolean {
      const deleted = this.cache.delete(taskId)
      if (deleted) {
         this.logger.debug(`Completed pending task: ${taskId}`)
      }
      return deleted
   }

   /**
    * Clear all pending tasks.
    */
   clear(): void {
      this.cache.clear()
      this.logger.log("Pending tasks cache cleared")
   }

   /**
    * Get cache statistics.
    */
   getStats(): { pendingCount: number; maxEntries: number } {
      return {
         pendingCount: this.cache.size,
         maxEntries: this.cache.max,
      }
   }

   /**
    * Get list of all pending task IDs.
    */
   getPendingTaskIds(): PaintTaskId[] {
      return Array.from(this.cache.keys())
   }
}
