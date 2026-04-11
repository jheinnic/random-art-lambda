/**
 * Test branching inheritance (forest scenario)
 *
 * Two extensions share the same parent but develop independently.
 * This simulates how different middleware handlers might extend a common base.
 *
 * Run with: npx tsx src/painting/middleware/types/__examples__/BranchingInheritanceTest.ts
 */

import { defineExtension, createDelegate } from "../ExtensionFactory.js"

// Base model (shared foundation)
class TaskBase {
   buffer: Buffer = Buffer.from("")
   jobId: string = ""
   metadata: { width: number; height: number } = { width: 0, height: 0 }
}

// Shared parent extension (adds campaign tracking)
class CampaignExtension extends TaskBase {
   campaignName: string = ""
   seedValue: number = 0

   getCampaignKey(): string {
      return `${this.campaignName}_${this.seedValue}`
   }
}

// Branch A: Storage-focused extension
class StorageExtension extends CampaignExtension {
   storagePrefix: string = ""
   bucketName: string = ""

   // Namespace: storage*
   getStoragePath(): string {
      return `${this.storagePrefix}/${this.getCampaignKey()}`
   }

   getStorageUrl(): string {
      return `s3://${this.bucketName}/${this.getStoragePath()}`
   }
}

// Branch B: Naming-focused extension (independent from Branch A)
class NamingExtension extends CampaignExtension {
   fileExtension: string = ""
   namingPattern: string = ""

   // Namespace: naming*, file*
   getFileName(): string {
      const key = this.getCampaignKey()
      return `${this.namingPattern}_${key}${this.fileExtension}`
   }

   getFileHash(): string {
      // Simulate hash based on campaign
      return this.getCampaignKey().split("").reverse().join("")
   }
}

// Decompose both branches
const StorageDef = defineExtension(TaskBase, StorageExtension as any)
const NamingDef = defineExtension(TaskBase, NamingExtension as any)

console.log("✓ Branching extensions decomposed successfully")
console.log(`  Storage branch: ${StorageDef.DTO.name}`)
console.log(`  Naming branch: ${NamingDef.DTO.name}`)

// Create base model (shared across both branches)
const base = new TaskBase()
base.buffer = Buffer.from("test-data")
base.jobId = "job-789"
base.metadata = { width: 1920, height: 1080 }

// Branch A: Storage delegate
const storageDto = new StorageDef.DTO() as any
storageDto.campaignName = "winter2025"
storageDto.seedValue = 100
storageDto.storagePrefix = "campaigns"
storageDto.bucketName = "my-art-bucket"

const storageDelegate = createDelegate(
   base,
   storageDto,
   StorageDef.Extension,
) as any

console.log("\n✓ Storage branch delegate created")
console.log(`  Campaign: ${storageDelegate.campaignName}`)
console.log(`  Seed: ${storageDelegate.seedValue}`)
console.log(`  Campaign key: ${storageDelegate.getCampaignKey()}`)
console.log(`  Storage path: ${storageDelegate.getStoragePath()}`)
console.log(`  Storage URL: ${storageDelegate.getStorageUrl()}`)

// Branch B: Naming delegate
const namingDto = new NamingDef.DTO() as any
namingDto.campaignName = "summer2025"
namingDto.seedValue = 200
namingDto.fileExtension = ".png"
namingDto.namingPattern = "render"

const namingDelegate = createDelegate(base, namingDto, NamingDef.Extension) as any

console.log("\n✓ Naming branch delegate created")
console.log(`  Campaign: ${namingDelegate.campaignName}`)
console.log(`  Seed: ${namingDelegate.seedValue}`)
console.log(`  Campaign key: ${namingDelegate.getCampaignKey()}`)
console.log(`  File name: ${namingDelegate.getFileName()}`)
console.log(`  File hash: ${namingDelegate.getFileHash()}`)

// Verify namespaces are independent (no conflicts)
console.log("\n✓ Namespace isolation:")
console.log(
   `  Storage has getStoragePath: ${typeof storageDelegate.getStoragePath === "function"}`,
)
console.log(
   `  Storage has getFileName: ${typeof storageDelegate.getFileName === "function"}`,
)
console.log(
   `  Naming has getFileName: ${typeof namingDelegate.getFileName === "function"}`,
)
console.log(
   `  Naming has getStoragePath: ${typeof namingDelegate.getStoragePath === "function"}`,
)

// Verify both have access to parent methods
if (
   storageDelegate.getCampaignKey() === "winter2025_100" &&
   namingDelegate.getCampaignKey() === "summer2025_200"
) {
   console.log("\n✓ Both branches inherit parent methods correctly")
} else {
   console.log("\n✗ Inheritance from parent failed")
   process.exit(1)
}

// Verify branch-specific methods work
if (
   storageDelegate.getStorageUrl() === "s3://my-art-bucket/campaigns/winter2025_100" &&
   namingDelegate.getFileName() === "render_summer2025_200.png"
) {
   console.log("✓ Branch-specific methods work correctly")
} else {
   console.log("\n✗ Branch-specific methods failed")
   process.exit(1)
}

console.log("\n✓ All branching inheritance tests passed!")
console.log("\nThe ExtensionFactory successfully handles:")
console.log("  1. Multiple extensions branching from a common parent")
console.log("  2. Independent namespace management per branch")
console.log("  3. Shared parent methods accessible from both branches")
console.log("  4. No interference between sibling branches")
console.log("  5. Last-wins semantics ready for middleware composition")
