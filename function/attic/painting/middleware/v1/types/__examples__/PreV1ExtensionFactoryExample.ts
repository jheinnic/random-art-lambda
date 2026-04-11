/**
 * Example usage of ExtensionFactory pattern
 *
 * This demonstrates how to define extensions naturally and have them
 * decomposed into DTO + Static Extension + Delegate types.
 */

import { defineExtension, createDelegate } from "../ExtensionFactory.js"
import * as crypto from "crypto"

// ============================================================================
// Base Framework Model (provided by the framework)
// ============================================================================

interface BaseModel {
   buffer: Buffer
   jobId: string
   metadata: {
      width: number
      height: number
   }
}

// ============================================================================
// Developer writes this naturally (no boilerplate!)
// ============================================================================

class CampaignExtension {
   // Data properties (will become DTO)
   campaignName: string = ""
   seedValue: number = 0

   // Helper methods (will become static extension methods)
   // Methods can call each other via `this` - this works!
   getCampaignHash(): string {
      const content = this.campaignName + this.seedValue.toString()
      return crypto.createHash("sha256").update(content).digest("hex")
   }

   getShortHash(): string {
      return this.getCampaignHash().slice(0, 12)
   }

   getFilename(): string {
      const hash = this.getShortHash()
      return `${hash.slice(0, 2)}/${hash.slice(2)}.png`
   }

   getCampaignPrefix(): string {
      return `campaign_${this.campaignName}_${this.seedValue}`
   }
}

// ============================================================================
// Factory decomposes the blueprint
// ============================================================================

const Campaign = defineExtension(
   {} as any as new () => BaseModel, // Base constructor (would be injected)
   CampaignExtension,
)

// ============================================================================
// Type checking: What did we get?
// ============================================================================

// The DTO has only data properties
type CampaignDTO = InstanceType<typeof Campaign.DTO>
// { campaignName: string, seedValue: number }

// The Delegate has everything: Base + DTO + Extension methods
type CampaignDelegate = InstanceType<typeof Campaign.Delegate>
// {
//   buffer: Buffer,
//   jobId: string,
//   metadata: { width: number, height: number },
//   campaignName: string,
//   seedValue: number,
//   getCampaignHash(): string,
//   getShortHash(): string,
//   getFilename(): string,
//   getCampaignPrefix(): string
// }

// ============================================================================
// Runtime usage example
// ============================================================================

export function exampleUsage() {
   // 1. Create base model (from framework)
   const baseModel: BaseModel = {
      buffer: Buffer.from("test"),
      jobId: "job-123",
      metadata: { width: 800, height: 600 },
   }

   // 2. Create DTO with data (from user input or previous middleware)
   const dto = new Campaign.DTO()
   dto.campaignName = "summer2024"
   dto.seedValue = 42

   // 3. Create unified delegate
   const delegate = createDelegate(baseModel, dto, Campaign.Extension)

   // 4. Now the delegate has everything!
   console.log("Job ID:", delegate.jobId) // From base
   console.log("Campaign:", delegate.campaignName) // From DTO
   console.log("Hash:", delegate.getCampaignHash()) // From extension
   console.log("Filename:", delegate.getFilename()) // Calls getShortHash() internally!

   // 5. Pass delegate to jse-eval expressions
   const expression = "`${getCampaignPrefix()}_${metadata.width}x${metadata.height}.png`"
   // Expression sees: getCampaignPrefix, metadata.width, metadata.height
   // All available in the flat namespace!

   return delegate
}

// ============================================================================
// Middleware usage example
// ============================================================================

export class CampaignMiddleware {
   async handle(ctx: CampaignDelegate) {
      // Middleware receives the unified delegate
      // It has type-safe access to everything:

      // Base properties
      const buffer = ctx.buffer
      const jobId = ctx.jobId

      // DTO properties
      const campaign = ctx.campaignName
      const seed = ctx.seedValue

      // Extension methods
      const filename = ctx.getFilename()
      const hash = ctx.getCampaignHash()

      // Can compile expressions and pass ctx directly
      // const fn = compileAsync(expression)
      // const result = await fn(ctx)  // ctx has everything!

      return {
         model: { generatedFilename: filename },
         disposition: "OK" as const,
      }
   }
}

// ============================================================================
// Type verification tests
// ============================================================================

function typeTests() {
   const delegate = exampleUsage()

   // Should have base properties
   const _buffer: Buffer = delegate.buffer
   const _jobId: string = delegate.jobId
   const _width: number = delegate.metadata.width

   // Should have DTO properties
   const _campaign: string = delegate.campaignName
   const _seed: number = delegate.seedValue

   // Should have extension methods
   const _hash: string = delegate.getCampaignHash()
   const _filename: string = delegate.getFilename()

   // Methods should be callable and work correctly
   const hash1 = delegate.getCampaignHash()
   const hash2 = delegate.getShortHash() // Should call getCampaignHash() internally
   const filename = delegate.getFilename() // Should call getShortHash() internally

   console.log({ hash1, hash2, filename })
}
