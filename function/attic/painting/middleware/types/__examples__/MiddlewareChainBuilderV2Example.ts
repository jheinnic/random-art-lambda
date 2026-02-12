/**
 * Example demonstrating MiddlewareChainBuilderV2 with dependency injection
 *
 * Shows how the builder integrates dependency injection for application middleware
 * while maintaining super-delegate pattern for framework middleware.
 *
 * Run with: npx tsx src/painting/middleware/types/__examples__/MiddlewareChainBuilderV2Example.ts
 */

import { defineExtensionV2 } from "../ExtensionFactoryV2.js"
import { MiddlewareChainBuilderV2 } from "../MiddlewareChainBuilderV2.js"
import { MiddlewareHandler } from "../MiddlewareHandler.js"
import { MiddlewareResult } from "../MiddlewareResult.js"
import { JobDisposition } from "../JobDisposition.js"

// ============================================================================
// Base Model
// ============================================================================

class BaseModel {
   jobId = ""
   buffer = Buffer.from("")
}

// ============================================================================
// Application Middleware - Campaign (no dependencies)
// ============================================================================

interface ICampaign {
   campaignId: string
   getCampaignKey: () => string
}

class _Campaign implements ICampaign {
   constructor(private readonly base: BaseModel) {}

   campaignId = ""

   get jobId() {
      return this.base.jobId
   }

   getCampaignKey(): string {
      return `campaign:${this.campaignId}`
   }
}

const CampaignExt = defineExtensionV2<BaseModel, _Campaign, ICampaign>(
   BaseModel,
   _Campaign,
   ["base"],
   [BaseModel],
)

class CampaignHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      console.log(`  CampaignHandler: Processing job ${ctx.jobId}`)

      return {
         disposition: JobDisposition.OK,
         model: { campaignId: "camp-123" },
      }
   }
}

// ============================================================================
// Application Middleware - Storage Path (depends on Campaign)
// ============================================================================

interface IStoragePath {
   storageKey: string
   getStorageKey: () => string
}

class _StoragePath implements IStoragePath {
   constructor(
      private readonly base: BaseModel,
      private readonly campaign: ICampaign,
   ) {}

   storageKey = ""

   get jobId(): string {
      return this.base.jobId
   }

   getStorageKey(): string {
      // Uses injected campaign dependency to build storage path
      // Note: Does NOT include bucket/root - that's FileStore's responsibility
      return `${this.campaign.getCampaignKey()}/${this.storageKey}`
   }
}

const StoragePathExt = defineExtensionV2<BaseModel, _StoragePath, IStoragePath>(
   BaseModel,
   _StoragePath,
   ["base", "campaign"],
   [BaseModel, _Campaign], // Explicit dependency on Campaign
)

class StoragePathHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      console.log(`  StoragePathHandler: Using campaign ${ctx.campaignId}`)

      return {
         disposition: JobDisposition.OK,
         model: { storageKey: "renders" },
      }
   }
}

// ============================================================================
// Application Middleware - Naming (depends on StoragePath)
// ============================================================================

interface INaming {
   fileName: string
   getFullPath: () => string
}

class _Naming implements INaming {
   constructor(
      private readonly base: BaseModel,
      private readonly storagePath: IStoragePath,
   ) {}

   fileName = ""

   get jobId() {
      return this.base.jobId
   }

   getFullPath(): string {
      // Uses injected storagePath dependency!
      // Still doesn't know about bucket - just builds relative path
      return `${this.storagePath.getStorageKey()}/${this.fileName}`
   }
}

const NamingExt = defineExtensionV2<BaseModel, _Naming, INaming>(
   BaseModel,
   _Naming,
   ["base", "storagePath"],
   [BaseModel, _StoragePath], // Explicit dependency on StoragePath
)

class NamingHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      console.log(`  NamingHandler: Using storage key ${ctx.storageKey}`)

      return {
         disposition: JobDisposition.OK,
         model: { fileName: "output.png" },
      }
   }
}

// ============================================================================
// Framework Middleware - Logger (sees all extensions via super-delegate)
// ============================================================================

interface ILogger {
   logTimestamp: number
}

class _Logger implements ILogger {
   constructor(private readonly base: BaseModel) {}

   logTimestamp = Date.now()

   get jobId() {
      return this.base.jobId
   }
}

const LoggerExt = defineExtensionV2<BaseModel, _Logger, ILogger>(
   BaseModel,
   _Logger,
   ["base"],
   [BaseModel],
)

class LoggerHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      // Framework middleware can see ALL extensions via super-delegate
      console.log(`  LoggerHandler: Full context inspection`)
      console.log(`    - jobId: ${ctx.jobId}`)
      console.log(`    - campaignId: ${ctx.campaignId}`)
      console.log(`    - storageKey: ${ctx.storageKey}`)
      console.log(`    - fileName: ${ctx.fileName}`)

      // Can call methods from ANY extension!
      console.log(`    - getCampaignKey(): ${ctx.getCampaignKey()}`)
      console.log(`    - getStorageKey(): ${ctx.getStorageKey()}`)
      console.log(`    - getFullPath(): ${ctx.getFullPath()}`)

      return {
         disposition: JobDisposition.OK,
         model: { logTimestamp: Date.now() },
      }
   }
}

// ============================================================================
// Execute Middleware Chain
// ============================================================================

console.log("=== MiddlewareChainBuilderV2 Example ===\n")

const baseContext = new BaseModel()
baseContext.jobId = "job-456"
baseContext.buffer = Buffer.from("test-data")

console.log("Building middleware chain with dependency injection...\n")

const result = await new MiddlewareChainBuilderV2(baseContext, BaseModel)
   .add(CampaignExt, new CampaignHandler()) // No dependencies
   .add(StoragePathExt, new StoragePathHandler()) // Depends on Campaign
   .add(NamingExt, new NamingHandler()) // Depends on StoragePath
   .add(LoggerExt, new LoggerHandler()) // Framework middleware (sees all)
   .execute()

console.log("\n=== Final Result ===")
console.log(`jobId: ${(result as any).jobId}`)
console.log(`campaignId: ${(result as any).campaignId}`)
console.log(`storageKey: ${(result as any).storageKey}`)
console.log(`fileName: ${(result as any).fileName}`)
console.log(`logTimestamp: ${(result as any).logTimestamp}`)

console.log("\n=== Method Calls (via super-delegate) ===")
console.log(`getCampaignKey(): ${(result as any).getCampaignKey()}`)
console.log(`getStorageKey(): ${(result as any).getStorageKey()}`)
console.log(`getFullPath(): ${(result as any).getFullPath()}`)

console.log("\n=== Dependency Chain ===")
console.log("  BaseModel")
console.log("      ↓")
console.log("  Campaign (uses BaseModel)")
console.log("      ↓")
console.log("  StoragePath (uses BaseModel + Campaign)")
console.log("      ↓")
console.log("  Naming (uses BaseModel + StoragePath)")
console.log("      ↓")
console.log("  Logger (framework - sees all via super-delegate)")
console.log("\n=== Key Point ===")
console.log("Middleware builds relative paths (campaign/renders/output.png)")
console.log("FileStore adds storage root (s3://bucket/ or /local/path/)")
console.log("Middleware never manipulates bucket/storage configuration!")

console.log("\n✓ All extensions properly injected!")
console.log("✓ No non-deterministic initialization!")
console.log("✓ Framework middleware has full visibility!")
