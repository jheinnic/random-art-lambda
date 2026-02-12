import { PermutationSpec } from "./PermutationSpec.js"
import { RegionMapCatalog } from "./RegionMapCatalog.js"

/**
 * Complete project specification
 * Combines a shared RegionMap catalog with permutation expansion logic
 *
 * Example:
 * {
 *   "projectId": "bagua-gallery-001",
 *   "name": "Bagua Multi-Resolution Gallery",
 *   "regionMapCatalog": {
 *     "thumbnail": { "cid": "Qm...", "description": "240x240 preview" },
 *     "detail": { "cid": "Qm...", "description": "1024x1024 full size" },
 *     "zoomed": { "cid": "Qm...", "description": "Zoomed to center region" }
 *   },
 *   "permutation": {
 *     "expandType": "permuteAllPairs",
 *     "regionMapNames": ["thumbnail", "detail"],
 *     "sources": ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"],
 *     "includeIdentity": true
 *   }
 * }
 */
export interface TrigramProjectSpec {
   /**
    * Unique project identifier (ULID or custom ID)
    */
   projectId: string

   /**
    * Catalog of RegionMap names to CIDs, shared across all permutations.
    * Each entry maps a friendly name to an IPFS CID and optional description.
    */
   regionMapCatalog: RegionMapCatalog

   /**
    * Permutation specification for task expansion.
    * References regionMapNames from the catalog above.
    */
   permutationSpecs: PermutationSpec[]

   /**
    * Timestamp when project was created
    */
   createdAt?: number
}
