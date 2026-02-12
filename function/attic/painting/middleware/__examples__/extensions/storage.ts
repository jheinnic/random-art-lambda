/**
 * Storage Extension
 *
 * Augments PipelineContext with storage path properties and methods.
 * Depends on: campaign
 */

import { PipelineContext } from "../PipelineContext.js"
import "./campaign.js" // ← Import dependency to ensure it's augmented first

// Augment PipelineContext interface
declare module "../PipelineContext.js" {
   interface PipelineContext {
      storageKey: string
      getStorageKey(): string
   }
}

// Add method implementation to prototype
PipelineContext.prototype.getStorageKey = function () {
   // Can call getCampaignKey() because campaign.ts augmented the interface
   return `${this.getCampaignKey()}/${this.storageKey}`
}

/**
 * Populate storage data
 */
export function populateStorage(ctx: PipelineContext): void {
   // Uses campaign data (dependency)
   ctx.storageKey = "renders"
}
