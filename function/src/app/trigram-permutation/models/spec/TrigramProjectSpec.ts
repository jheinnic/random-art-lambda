import type { PermutationProjectSpec } from "./PermutationInputSpec.js"
import { PermutationSpec } from "./PermutationSpec.js"
import { RegionMapCatalog } from "./RegionMapCatalog.js"

/**
 * Complete project specification
 * Combines a shared RegionMap catalog with permutation expansion logic
 *
 * Extends PermutationProjectSpec to inherit projectId and fileNameExpression
 * from the mid-tier permutation framework.
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
 *   "permutationSpecs": [
 *     {
 *       "expandType": "permuteAllPairs",
 *       "regionMapNames": ["thumbnail", "detail"],
 *       "sourceTrigrams": ["☰", "☱", "☲", "☳", "☴", "☵", "☶", "☷"],
 *       "includeIdentity": true
 *     }
 *   ],
 *   "fileNameExpression": "${_methods.prefixTerm()}_${_methods.suffixTerm()}.png"
 * }
 */
export interface TrigramProjectSpec extends PermutationProjectSpec {
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
