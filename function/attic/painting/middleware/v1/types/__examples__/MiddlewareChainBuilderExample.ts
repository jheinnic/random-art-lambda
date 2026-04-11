/**
 * Example demonstrating MiddlewareChainBuilder with ExtensionFactory
 *
 * Shows how to:
 * 1. Define extension classes naturally
 * 2. Decompose them with defineExtension
 * 3. Build a type-safe middleware chain with intersection type accumulation
 * 4. Execute the chain with unified delegates at each step
 */

import { defineExtension } from "../ExtensionFactory.js"
import { MiddlewareChainBuilder } from "../MiddlewareChainBuilder.js"
import { MiddlewareHandler } from "../MiddlewareHandler.js"
import { MiddlewareResult } from "../MiddlewareResult.js"
import { JobDisposition } from "../JobDisposition.js"

// ============================================================================
// Base Model (provided by framework)
// ============================================================================

interface TaskBase {
   buffer: Buffer
   jobId: string
   metadata: {
      width: number
      height: number
   }
}

// ============================================================================
// Extension 1: Campaign tracking
// ============================================================================

class CampaignExtension {
   campaignName: string = ""
   seedValue: number = 0

   getCampaignKey(): string {
      return `${this.campaignName}_${this.seedValue}`
   }
}

const Campaign = defineExtension(
   {} as any as new () => TaskBase,
   CampaignExtension,
)

// ============================================================================
// Extension 2: Storage paths
// ============================================================================

class StorageExtension extends CampaignExtension {
   storagePrefix: string = ""
   bucketName: string = ""

   getStoragePath(): string {
      return `${this.storagePrefix}/${this.getCampaignKey()}`
   }

   getStorageUrl(): string {
      return `s3://${this.bucketName}/${this.getStoragePath()}`
   }
}

const Storage = defineExtension(
   {} as any as new () => TaskBase,
   StorageExtension,
)

// ============================================================================
// Extension 3: File naming
// ============================================================================

class NamingExtension extends CampaignExtension {
   fileExtension: string = ""
   namingPattern: string = ""

   getFileName(): string {
      const key = this.getCampaignKey()
      return `${this.namingPattern}_${key}${this.fileExtension}`
   }
}

const Naming = defineExtension(
   {} as any as new () => TaskBase,
   NamingExtension,
)

// ============================================================================
// Middleware Handlers
// ============================================================================

class CampaignMiddleware
   implements MiddlewareHandler<typeof Campaign.DTO, undefined>
{
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      console.log(`[Campaign] Processing job ${ctx.jobId}`)

      // Extract campaign info from job metadata
      const campaignName = "winter2025"
      const seedValue = 42

      return {
         model: {
            campaignName,
            seedValue,
         },
         disposition: JobDisposition.OK,
      }
   }
}

class StorageMiddleware implements MiddlewareHandler<typeof Storage.DTO, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      console.log(`[Storage] Campaign: ${ctx.getCampaignKey()}`)

      // Use campaign info to determine storage location
      const storagePrefix = "campaigns"
      const bucketName = "my-art-bucket"

      return {
         model: {
            storagePrefix,
            bucketName,
         },
         disposition: JobDisposition.OK,
      }
   }
}

class NamingMiddleware implements MiddlewareHandler<typeof Naming.DTO, undefined> {
   async handle(ctx: any): Promise<MiddlewareResult<any, undefined>> {
      console.log(`[Naming] Campaign: ${ctx.getCampaignKey()}`)

      // Determine file naming based on campaign
      const fileExtension = ".png"
      const namingPattern = "render"

      const fileName = `${namingPattern}_${ctx.getCampaignKey()}${fileExtension}`
      console.log(`[Naming] Generated filename: ${fileName}`)

      return {
         model: {
            fileExtension,
            namingPattern,
         },
         disposition: JobDisposition.OK,
      }
   }
}

// ============================================================================
// Build and Execute Chain
// ============================================================================

export async function exampleChainExecution() {
   // Create base context
   const baseContext: TaskBase = {
      buffer: Buffer.from("test-image-data"),
      jobId: "job-12345",
      metadata: {
         width: 1920,
         height: 1080,
      },
   }

   // Build chain with type accumulation
   const builder = new MiddlewareChainBuilder(baseContext)
      .add(Campaign, new CampaignMiddleware())
      // Type is now: TaskBase & CampaignDelegate
      .add(Storage, new StorageMiddleware())
      // Type is now: TaskBase & CampaignDelegate & StorageDelegate
      .add(Naming, new NamingMiddleware())
   // Type is now: TaskBase & CampaignDelegate & StorageDelegate & NamingDelegate

   // Execute chain
   console.log("Executing middleware chain...")
   const result = await builder.execute()

   // Result has full accumulated type - TypeScript knows all properties!
   console.log("\nFinal result:")
   console.log(`  Job ID: ${result.jobId}`)
   console.log(`  Campaign: ${(result as any).getCampaignKey()}`)
   console.log(`  Storage URL: ${(result as any).getStorageUrl()}`)
   console.log(`  Filename: ${(result as any).getFileName()}`)

   return result
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
   exampleChainExecution()
      .then(() => {
         console.log("\n✓ Chain execution completed successfully")
      })
      .catch((error) => {
         console.error("\n✗ Chain execution failed:", error)
         process.exit(1)
      })
}
