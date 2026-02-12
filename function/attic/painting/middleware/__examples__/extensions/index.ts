/**
 * All Extensions Barrel
 *
 * Import order defines dependency order.
 * Each import augments PipelineContext via declaration merging.
 */

// Import in dependency order
import "./campaign.js" // No dependencies
import "./contentHash.js" // No dependencies
import "./storage.js" // Depends on campaign
import "./naming.js" // Depends on storage
import "./fileStorage.js" // Depends on naming (uses getFullPath)

// Re-export populate functions
export { populateCampaign } from "./campaign.js"
export { populateStorage } from "./storage.js"
export { populateNaming } from "./naming.js"
export { populateContentHash } from "./contentHash.js"

// Re-export injection functions
export { injectFileStore, type IFileStore } from "./fileStorage.js"

// Re-export symbols
export * from "./symbols.js"
