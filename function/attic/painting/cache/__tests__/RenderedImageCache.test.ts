import {
   RenderedImageCache,
   CachedRenderedImage,
} from "../RenderedImageCache.js"
import { ULIDString } from "../../../../src/messages/interface/NamedValues.js"
import { Logger } from "@nestjs/common"
import { describe, expect, it, beforeEach, jest } from "@jest/globals"

/**
 * Mock LRU cache for testing
 */
class MockLRUCache<K, V> {
   private readonly store = new Map<K, V>()
   public disposeCalls: Array<{ value: V; key: K; reason: string }> = []

   constructor(
      private readonly options: {
         max: number
         maxSize: number
         sizeCalculation: (value: V) => number
         dispose: (value: V, key: K, arg2: string) => unknown
         // sizeCalculation?: (n: number) => number
      },
   ) {}

   set(key: K, value: V, _options?: any): this {
      this.store.set(key, value)
      return this
   }

   get(key: K): V | undefined {
      return this.store.get(key)
   }

   has(key: K): boolean {
      return this.store.has(key)
   }

   delete(key: K): boolean {
      return this.store.delete(key)
   }

   clear(): void {
      this.store.clear()
   }

   get size(): number {
      return this.store.size
   }

   get max(): number {
      return this.options.max ?? 0
   }

   get maxSize(): number {
      return this.options.maxSize ?? 0
   }

   get calculatedSize(): number {
      let total = 0
      for (const value of this.store.values()) {
         total += this.options.sizeCalculation?.(value) ?? 0
      }
      return total
   }

   keys(): IterableIterator<K> {
      return this.store.keys()
   }

   // Simulate eviction
   simulateEvict(key: K): void {
      const value = this.store.get(key)
      if (value != null) {
         this.store.delete(key)
         if (this.options.dispose != null) {
            this.options.dispose(value, key, "evict")
         }
         this.disposeCalls.push({ value, key, reason: "evict" })
      }
   }
}

/**
 * Mock Logger for testing
 */
class MockLogger extends Logger {
   public logs: string[] = []
   public debugs: string[] = []

   log(message: string): void {
      this.logs.push(message)
   }

   debug(message: string): void {
      this.debugs.push(message)
   }
}

describe("RenderedImageCache", () => {
   let cache: RenderedImageCache
   let mockLRU: MockLRUCache<ULIDString, CachedRenderedImage>
   let mockLogger: MockLogger

   beforeEach(() => {
      mockLRU = new MockLRUCache<ULIDString, CachedRenderedImage>({
         max: 100,
         maxSize: 200 * 1024 * 1024,
         sizeCalculation: (value: CachedRenderedImage) => value.buffer.length,
         dispose: () => {
            /* no-op for tests */
         },
      })
      mockLogger = new MockLogger()

      cache = new RenderedImageCache(
         { cacheInstance: mockLRU as any },
         mockLogger,
      )
   })

   describe("set and get", () => {
      it("should store and retrieve a rendered image", () => {
         const taskId = "01HQ5K..." as ULIDString
         const buffer = Buffer.from("test image data")
         const width = 1024
         const height = 768

         cache.set(taskId, buffer, width, height)

         const cached = cache.get(taskId)
         expect(cached).toBeDefined()
         expect(cached?.buffer).toEqual(buffer)
         expect(cached?.width).toBe(width)
         expect(cached?.height).toBe(height)
      })

      it("should include staged location when provided", () => {
         const taskId = "01HQ5K..." as ULIDString
         const buffer = Buffer.from("test")
         const stagedLocation = {
            s3Uri: "s3://bucket/key.png",
            primaryPath: "s3://bucket/key.png",
         }

         cache.set(taskId, buffer, 100, 100, stagedLocation)

         const cached = cache.get(taskId)
         expect(cached?.stagedLocation).toEqual(stagedLocation)
      })

      it("should return undefined for non-existent taskId", () => {
         const cached = cache.get("nonexistent" as ULIDString)
         expect(cached).toBeUndefined()
      })
   })

   describe("has", () => {
      it("should return true for cached taskId", () => {
         const taskId = "01HQ5K..." as ULIDString
         cache.set(taskId, Buffer.from("test"), 100, 100)

         expect(cache.has(taskId)).toBe(true)
      })

      it("should return false for non-existent taskId", () => {
         expect(cache.has("nonexistent" as ULIDString)).toBe(false)
      })
   })

   describe("delete", () => {
      it("should delete cached entry", () => {
         const taskId = "01HQ5K..." as ULIDString
         cache.set(taskId, Buffer.from("test"), 100, 100)

         expect(cache.has(taskId)).toBe(true)
         const deleted = cache.delete(taskId)
         expect(deleted).toBe(true)
         expect(cache.has(taskId)).toBe(false)
      })

      it("should return false when deleting non-existent entry", () => {
         const deleted = cache.delete("nonexistent" as ULIDString)
         expect(deleted).toBe(false)
      })

      it("should log debug message on delete", () => {
         const taskId = "01HQ5K..." as ULIDString
         cache.set(taskId, Buffer.from("test"), 100, 100)
         cache.delete(taskId)

         expect(mockLogger.debugs).toContain("Cache deleted: 01HQ5K...")
      })
   })

   describe("clear", () => {
      it("should clear all cached entries", () => {
         cache.set("task1" as ULIDString, Buffer.from("1"), 100, 100)
         cache.set("task2" as ULIDString, Buffer.from("2"), 100, 100)

         expect(mockLRU.size).toBe(2)
         cache.clear()
         expect(mockLRU.size).toBe(0)
      })

      it("should log message on clear", () => {
         cache.clear()
         expect(mockLogger.logs).toContain("Cache cleared")
      })
   })

   describe("getCachedTaskIds", () => {
      it("should return all cached task IDs", () => {
         const task1 = "01HQ5K..." as ULIDString
         const task2 = "01HQ5M..." as ULIDString

         cache.set(task1, Buffer.from("1"), 100, 100)
         cache.set(task2, Buffer.from("2"), 100, 100)

         const ids = cache.getCachedTaskIds()
         expect(ids).toContain(task1)
         expect(ids).toContain(task2)
         expect(ids.length).toBe(2)
      })

      it("should return empty array when cache is empty", () => {
         const ids = cache.getCachedTaskIds()
         expect(ids).toEqual([])
      })
   })

   describe("getStats", () => {
      it("should return cache statistics", () => {
         const buffer = Buffer.alloc(2 * 1024 * 1024) // 2MB
         cache.set("task1" as ULIDString, buffer, 100, 100)

         const stats = cache.getStats()
         expect(stats.size).toBe(1)
         expect(stats.maxEntries).toBe(100)
         expect(parseFloat(stats.totalSizeMB)).toBeCloseTo(2, 1)
      })
   })

   describe("logging", () => {
      it("should log cache HIT on successful get", () => {
         const taskId = "01HQ5K..." as ULIDString
         cache.set(taskId, Buffer.from("test"), 100, 100)
         cache.get(taskId)

         const hitLog = mockLogger.debugs.find((log) =>
            log.includes("Cache HIT"),
         )
         expect(hitLog).toBeDefined()
         expect(hitLog).toContain(taskId.slice(0, 16))
      })

      it("should log cache MISS on failed get", () => {
         cache.get("nonexistent" as ULIDString)

         const missLog = mockLogger.debugs.find((log) =>
            log.includes("Cache MISS"),
         )
         expect(missLog).toBeDefined()
      })

      it("should log when caching image", () => {
         const taskId = "01HQ5K..." as ULIDString
         cache.set(taskId, Buffer.from("test"), 1024, 768)

         const setLog = mockLogger.debugs.find((log) =>
            log.includes("Cached rendered image"),
         )
         expect(setLog).toBeDefined()
         expect(setLog).toContain("1024x768")
      })
   })

   describe("TTL handling", () => {
      it("should pass TTL to cache on set", () => {
         const taskId = "01HQ5K..." as ULIDString
         const ttl = 10000 // 10 seconds

         // Spy on mockLRU.set to verify TTL is passed
         const setSpy = jest.spyOn(mockLRU, "set")

         cache.set(taskId, Buffer.from("test"), 100, 100, undefined, ttl)

         expect(setSpy).toHaveBeenCalledWith(
            taskId,
            expect.objectContaining({ buffer: expect.any(Buffer) }),
            { ttl },
         )
      })
   })

   describe("cachedAt timestamp", () => {
      it("should set cachedAt to current time", () => {
         const before = new Date()
         const taskId = "01HQ5K..." as ULIDString

         cache.set(taskId, Buffer.from("test"), 100, 100)

         const cached = cache.get(taskId)
         if (cached == null) {
            // fail("Cache not defined!")
            throw new Error("No cached return")
         }
         const after = new Date()

         expect(cached?.cachedAt).toBeDefined()
         expect(cached.cachedAt.getTime()).toBeGreaterThanOrEqual(
            before.getTime(),
         )
         expect(cached.cachedAt.getTime()).toBeLessThanOrEqual(after.getTime())
      })
   })
})
