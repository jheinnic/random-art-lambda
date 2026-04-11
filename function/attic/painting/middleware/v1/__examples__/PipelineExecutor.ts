/**
 * Pipeline Executor
 *
 * Trivial executor that populates context data in dependency order.
 * Extensions are already on prototype via declaration merging.
 */

import { PipelineContext } from "./PipelineContext.js"
import {
   populateCampaign,
   populateContentHash,
   populateStorage,
   populateNaming,
} from "./extensions/index.js"

/**
 * Execute pipeline with all extensions
 */
export async function executePipeline(
   initialData: Partial<PipelineContext>,
): Promise<PipelineContext> {
   // Create context with base properties
   const ctx = new PipelineContext()

   // Copy initial data
   Object.assign(ctx, initialData)

   // Populate extensions in dependency order
   // (Methods already exist on prototype from declaration merging)

   populateCampaign(ctx) // No dependencies
   populateContentHash(ctx) // No dependencies
   populateStorage(ctx) // Depends on campaign
   populateNaming(ctx) // Depends on storage

   return ctx
}
