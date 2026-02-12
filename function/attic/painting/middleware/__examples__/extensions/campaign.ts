/**
 * Campaign Extension
 *
 * Augments PipelineContext with campaign-related properties and methods.
 * No dependencies beyond base model.
 */

import { PipelineContext } from "../PipelineContext.js"

// Augment PipelineContext interface via declaration merging
declare module "../PipelineContext.js" {
   interface PipelineContext {
      campaignId: string
      getCampaignKey(): string
   }
}

// Add method implementation to prototype
PipelineContext.prototype.getCampaignKey = function () {
   return `campaign:${this.campaignId}`
}

/**
 * Populate campaign data
 */
export function populateCampaign(ctx: PipelineContext): void {
   // Derive campaign ID from job ID
   ctx.campaignId = `camp-${ctx.jobId.substring(0, 8)}`
}
