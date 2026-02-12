/**
 * V3 Tests - No Framework Needed
 *
 * Tests work directly against real implementations.
 * No mocks, no fakes, no framework harness.
 */

import { PipelineContext } from "../PipelineContext"
import "../extensions/index" // Import all extensions
import { CONTENT_HASH_CACHE } from "../extensions/symbols"

describe("V3 PipelineContext - Declaration Merging", () => {
   describe("Campaign Extension", () => {
      it("should provide campaign methods", () => {
         const ctx = new PipelineContext()
         ctx.campaignId = "test-campaign"

         expect(ctx.getCampaignKey()).toBe("campaign:test-campaign")
      })
   })

   describe("Storage Extension", () => {
      it("should build storage paths using campaign", () => {
         const ctx = new PipelineContext()
         ctx.campaignId = "test-campaign"
         ctx.storageKey = "renders"

         expect(ctx.getStorageKey()).toBe("campaign:test-campaign/renders")
      })
   })

   describe("Naming Extension", () => {
      it("should build full paths using storage", () => {
         const ctx = new PipelineContext()
         ctx.campaignId = "test-campaign"
         ctx.storageKey = "renders"
         ctx.fileName = "output.png"

         expect(ctx.getFullPath()).toBe(
            "campaign:test-campaign/renders/output.png",
         )
      })
   })

   describe("Content Hash Extension", () => {
      it("should compute content hash", () => {
         const ctx = new PipelineContext()
         ctx.buffer = Buffer.from("test-data")

         const hash = ctx.getContentHash()
         expect(hash).toMatch(/^[0-9a-f]{64}$/)
      })

      it("should memoize hash computation", () => {
         const ctx = new PipelineContext()
         ctx.buffer = Buffer.from("test-data")

         const hash1 = ctx.getContentHash()
         const hash2 = ctx.getContentHash()

         // Same reference = memoization worked
         expect(hash1).toBe(hash2)

         // Verify cache exists on instance (as Symbol property)
         expect((ctx as any)[CONTENT_HASH_CACHE]).toBeDefined()
      })

      it("should derive prefix and suffix from cached hash", () => {
         const ctx = new PipelineContext()
         ctx.buffer = Buffer.from("test-data")

         const hash = ctx.getContentHash()
         const prefix = ctx.getHashPrefix()
         const suffix = ctx.getHashSuffix()

         expect(prefix).toBe(hash.substring(0, 2))
         expect(suffix).toBe(hash.substring(2, 4))
      })
   })

   describe("Full Pipeline Integration", () => {
      it("should work with all extensions together", () => {
         const ctx = new PipelineContext()
         ctx.jobId = "job-123"
         ctx.buffer = Buffer.from("image-data")
         ctx.campaignId = "camp-abc"
         ctx.storageKey = "renders"
         ctx.fileName = "output.png"

         // All methods available and working
         expect(ctx.getCampaignKey()).toBe("campaign:camp-abc")
         expect(ctx.getStorageKey()).toBe("campaign:camp-abc/renders")
         expect(ctx.getFullPath()).toBe(
            "campaign:camp-abc/renders/output.png",
         )
         expect(ctx.getContentHash()).toMatch(/^[0-9a-f]{64}$/)
         expect(ctx.getHashPrefix()).toMatch(/^[0-9a-f]{2}$/)
      })
   })

   describe("Development Flow", () => {
      it("allows discovering dependencies naturally", () => {
         // Developer writing new extension can explore what's available
         const ctx = new PipelineContext()

         // TypeScript autocomplete shows all available properties/methods
         ctx.jobId = "test"
         ctx.buffer = Buffer.from("data")
         ctx.campaignId = "camp"
         ctx.storageKey = "key"
         ctx.fileName = "file.png"

         // All methods callable - discovered through IntelliSense
         const campaign = ctx.getCampaignKey()
         const storage = ctx.getStorageKey()
         const path = ctx.getFullPath()
         const hash = ctx.getContentHash()

         // Natural composition - no framework needed!
         expect(campaign).toBeDefined()
         expect(storage).toBeDefined()
         expect(path).toBeDefined()
         expect(hash).toBeDefined()
      })
   })
})
