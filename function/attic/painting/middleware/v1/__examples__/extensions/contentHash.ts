/**
 * Content Hash Extension
 *
 * Augments PipelineContext with content hashing (with memoization).
 * No dependencies beyond base model.
 *
 * Uses Symbol for cache - won't be serialized!
 */

import { createHash } from "crypto"
import { PipelineContext } from "../PipelineContext.js"
import { CONTENT_HASH_CACHE } from "./symbols.js"

// Augment PipelineContext interface
declare module "../PipelineContext.js" {
   interface PipelineContext {
      getContentHash(): string
      getHashPrefix(): string
      getHashSuffix(): string
   }
}

// Add method implementations to prototype with memoization
PipelineContext.prototype.getContentHash = function () {
   // Symbol property - won't be serialized!
   const self = this as any
   if (self[CONTENT_HASH_CACHE] === undefined) {
      const hash = createHash("sha256")
      hash.update(this.buffer)
      self[CONTENT_HASH_CACHE] = hash.digest("hex")
   }
   return self[CONTENT_HASH_CACHE] as string
}

PipelineContext.prototype.getHashPrefix = function () {
   // Naturally calls memoized version
   return this.getContentHash().substring(0, 2)
}

PipelineContext.prototype.getHashSuffix = function () {
   // Also uses cached hash
   return this.getContentHash().substring(2, 4)
}

/**
 * Populate content hash (trigger computation)
 */
export function populateContentHash(ctx: PipelineContext): void {
   // Trigger hash computation (will be cached)
   ctx.getContentHash()
}
