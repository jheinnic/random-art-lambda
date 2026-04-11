/**
 * V3 Example - Declaration Merging Pattern
 *
 * Demonstrates:
 * - TypeScript native declaration merging
 * - No framework lock-in
 * - Natural development flow
 * - Memoization on instance
 * - Direct testability
 *
 * Run with: npx tsx src/painting/middleware/types/__examples__/v3/example.ts
 */

import { PipelineContext } from "./PipelineContext.js"
import { executePipeline } from "./PipelineExecutor.js"

console.log("=== V3 Architecture - Declaration Merging ===\n")

// Initialize with base data
const initialData = {
   jobId: "job-12345678",
   buffer: Buffer.from("test-image-data"),
}

console.log("Executing pipeline...\n")

const ctx = await executePipeline(initialData)

console.log("=== Results ===\n")
console.log(`jobId: ${ctx.jobId}`)
console.log(`buffer length: ${ctx.buffer.length}`)
console.log()

console.log("Campaign Extension:")
console.log(`  campaignId: ${ctx.campaignId}`)
console.log(`  getCampaignKey(): ${ctx.getCampaignKey()}`)
console.log()

console.log("Storage Extension:")
console.log(`  storageKey: ${ctx.storageKey}`)
console.log(`  getStorageKey(): ${ctx.getStorageKey()}`)
console.log()

console.log("Naming Extension:")
console.log(`  fileName: ${ctx.fileName}`)
console.log(`  getFullPath(): ${ctx.getFullPath()}`)
console.log()

console.log("Content Hash Extension (with memoization):")
console.log(`  getContentHash(): ${ctx.getContentHash()}`)
console.log(`  getHashPrefix(): ${ctx.getHashPrefix()}`)
console.log(`  getHashSuffix(): ${ctx.getHashSuffix()}`)
console.log()

console.log("=== Key Benefits ===\n")
console.log("✓ No framework lock-in")
console.log("✓ TypeScript native declaration merging")
console.log("✓ Methods naturally call each other via 'this'")
console.log("✓ Memoization caches live on instance")
console.log("✓ Direct testability without framework")
console.log("✓ Import order = dependency order")
console.log()

console.log("=== Direct Testing (No Framework) ===\n")

// Import extensions directly
import "./extensions/index.js"

// Create context without executor
const directCtx = new PipelineContext()
directCtx.jobId = "test-job"
directCtx.buffer = Buffer.from("test-data")
directCtx.campaignId = "test-campaign"
directCtx.storageKey = "test-storage"
directCtx.fileName = "test.png"

// Methods work directly!
console.log(
   `Direct call - getCampaignKey(): ${directCtx.getCampaignKey()}`,
)
console.log(`Direct call - getStorageKey(): ${directCtx.getStorageKey()}`)
console.log(`Direct call - getFullPath(): ${directCtx.getFullPath()}`)
console.log()

console.log("✓ Works without any framework!")
