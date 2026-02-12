/**
 * Naming Extension
 *
 * Augments PipelineContext with file naming properties and methods.
 * Depends on: storage (which depends on campaign)
 */

import { PipelineContext } from "../PipelineContext.js"
import "./storage.js" // ← Import dependency (transitively imports campaign)

// Augment PipelineContext interface
declare module "../PipelineContext.js" {
   interface PipelineContext {
      fileName: string
      getFullPath(): string
   }
}

// Add method implementation to prototype
PipelineContext.prototype.getFullPath = function () {
   // Can call getStorageKey() because storage.ts augmented the interface
   return `${this.getStorageKey()}/${this.fileName}`
}

/**
 * Populate naming data
 */
export function populateNaming(ctx: PipelineContext): void {
   // Simple filename assignment
   ctx.fileName = `${ctx.jobId}.png`
}
