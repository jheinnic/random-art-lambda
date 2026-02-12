import { LiteCIDString } from "../../../../messages/interface/index.js"

/**
 * Project-level RegionMap catalog
 * Maps friendly names to IPFS CIDs for RegionMap artifacts
 *
 * This catalog is defined once at the project level and shared across
 * all permutation specs within the project.
 */
export type RegionMapCatalog = {
   [name in string]: {
      cid: LiteCIDString
      description?: string
   }
}
