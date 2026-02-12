/**
 * Serialization Tests
 *
 * Demonstrates that Symbol properties (caches, injected dependencies)
 * are NOT serialized, while regular properties ARE.
 */

import { PipelineContext } from "../PipelineContext"
import "../extensions/index"
import {
   injectFileStore,
   type IFileStore,
} from "../extensions/fileStorage"

describe("V3 Serialization", () => {
   describe("Symbol Properties Excluded from Serialization", () => {
      it("should serialize model data but not caches", () => {
         const ctx = new PipelineContext()
         ctx.jobId = "job-123"
         ctx.buffer = Buffer.from("test-data")
         ctx.campaignId = "camp-abc"
         ctx.storageKey = "renders"
         ctx.fileName = "output.png"

         // Trigger cache population
         ctx.getContentHash()

         // Verify cache exists
         expect(ctx.getContentHash()).toMatch(/^[0-9a-f]{64}$/)

         // Serialize
         const json = JSON.stringify(ctx)
         const parsed = JSON.parse(json)

         // Model data IS serialized
         expect(parsed.jobId).toBe("job-123")
         expect(parsed.campaignId).toBe("camp-abc")
         expect(parsed.storageKey).toBe("renders")
         expect(parsed.fileName).toBe("output.png")

         // Buffer is serialized as object (Node.js behavior)
         expect(parsed.buffer).toBeDefined()

         // Symbol properties (cache) are NOT serialized
         expect(parsed).not.toHaveProperty("_contentHashCache")
         expect(Object.keys(parsed)).not.toContain("contentHashCache")
      })

      it("should not serialize injected dependencies", () => {
         const ctx = new PipelineContext()
         ctx.jobId = "job-123"
         ctx.buffer = Buffer.from("test-data")
         ctx.campaignId = "camp-abc"
         ctx.storageKey = "renders"
         ctx.fileName = "output.png"

         // Inject FileStore dependency
         const mockFileStore: IFileStore = {
            write: async () => {},
            read: async () => Buffer.from(""),
            exists: async () => true,
         }
         injectFileStore(ctx, mockFileStore)

         // Serialize
         const json = JSON.stringify(ctx)
         const parsed = JSON.parse(json)

         // Model data IS serialized
         expect(parsed.jobId).toBe("job-123")

         // FileStore dependency is NOT serialized
         expect(parsed).not.toHaveProperty("fileStore")
         expect(parsed).not.toHaveProperty("FILE_STORE")

         // Verify no trace of injected dependency
         const keys = Object.keys(parsed)
         expect(keys.some((k) => k.includes("fileStore"))).toBe(false)
         expect(keys.some((k) => k.includes("FILE_STORE"))).toBe(false)
      })
   })

   describe("Methods Not Serialized (Prototype)", () => {
      it("should not serialize methods", () => {
         const ctx = new PipelineContext()
         ctx.jobId = "job-123"
         ctx.campaignId = "camp-abc"

         // Methods exist on prototype
         expect(typeof ctx.getCampaignKey).toBe("function")
         expect(typeof ctx.getStorageKey).toBe("function")

         // Serialize
         const json = JSON.stringify(ctx)
         const parsed = JSON.parse(json)

         // Methods are NOT serialized
         expect(parsed.getCampaignKey).toBeUndefined()
         expect(parsed.getStorageKey).toBeUndefined()
         expect(parsed.getFullPath).toBeUndefined()
         expect(parsed.getContentHash).toBeUndefined()
      })
   })

   describe("Remote Worker Scenario", () => {
      it("should send only model data to remote worker", () => {
         // Main process context
         const mainCtx = new PipelineContext()
         mainCtx.jobId = "job-123"
         mainCtx.buffer = Buffer.from("image-data")
         mainCtx.campaignId = "camp-abc"
         mainCtx.storageKey = "renders"
         mainCtx.fileName = "output.png"

         // Trigger computations (cache populated)
         mainCtx.getContentHash()

         // Inject service (not serializable)
         const mockFileStore: IFileStore = {
            write: async () => {},
            read: async () => Buffer.from(""),
            exists: async () => true,
         }
         injectFileStore(mainCtx, mockFileStore)

         // Serialize for sending to remote worker
         const payload = JSON.stringify(mainCtx)

         // Remote worker receives payload
         const workerData = JSON.parse(payload)

         // Recreate context on remote worker
         const workerCtx = new PipelineContext()
         Object.assign(workerCtx, workerData)

         // Buffer needs to be reconstituted from serialized data
         workerCtx.buffer = Buffer.from(workerData.buffer.data)

         // Model data is available
         expect(workerCtx.jobId).toBe("job-123")
         expect(workerCtx.campaignId).toBe("camp-abc")
         expect(workerCtx.storageKey).toBe("renders")
         expect(workerCtx.fileName).toBe("output.png")

         // Methods work (from prototype)
         expect(workerCtx.getCampaignKey()).toBe("campaign:camp-abc")
         expect(workerCtx.getStorageKey()).toBe(
            "campaign:camp-abc/renders",
         )
         expect(workerCtx.getFullPath()).toBe(
            "campaign:camp-abc/renders/output.png",
         )

         // Cache was NOT transferred (will recompute)
         const hash1 = mainCtx.getContentHash()
         const hash2 = workerCtx.getContentHash() // Fresh computation
         expect(hash1).toBe(hash2) // Same value, but...

         // Verify they're different instances with separate caches
         expect(mainCtx).not.toBe(workerCtx)

         // Injected dependency NOT present (as expected)
         // Would need to re-inject on worker side if needed
      })
   })

   describe("What Gets Serialized", () => {
      it("should serialize only enumerable own properties", () => {
         const ctx = new PipelineContext()
         ctx.jobId = "job-123"
         ctx.buffer = Buffer.from("data")
         ctx.campaignId = "camp-abc"
         ctx.storageKey = "renders"
         ctx.fileName = "output.png"

         // Trigger cache and inject dependency
         ctx.getContentHash()
         const mockFileStore: IFileStore = {
            write: async () => {},
            read: async () => Buffer.from(""),
            exists: async () => true,
         }
         injectFileStore(ctx, mockFileStore)

         // What JSON.stringify sees
         const serialized = JSON.parse(JSON.stringify(ctx))
         const keys = Object.keys(serialized)

         // Model properties: YES
         expect(keys).toContain("jobId")
         expect(keys).toContain("buffer")
         expect(keys).toContain("campaignId")
         expect(keys).toContain("storageKey")
         expect(keys).toContain("fileName")

         // Methods (on prototype): NO
         expect(keys).not.toContain("getCampaignKey")
         expect(keys).not.toContain("getContentHash")

         // Symbol properties (cache, dependencies): NO
         const allKeys = [
            ...Object.keys(serialized),
            ...Object.getOwnPropertyNames(serialized),
         ]
         expect(allKeys.some((k) => k.includes("cache"))).toBe(false)
         expect(allKeys.some((k) => k.includes("fileStore"))).toBe(false)
      })
   })
})
