import type { PermutationSpec } from "./PermutationSpec.js"
import type { RegionMapCatalog } from "./RegionMapCatalog.js"

/**
 * Top-level user-facing project spec for the Trigram Permutation app.
 *
 * Describes a set of trigram term pairs to render against a catalog of region
 * maps. The PermutationExpander converts this into a PermutationsProjectSpec
 * for the Permutations middleware layer, which handles encoding, index
 * assignment, and BullMQ job production.
 *
 * Input encoding is always UTF-8 for Trigram — not a user-controlled field.
 */
export interface TrigramProjectSpec {
   /** Caller-assigned identifier for this project. */
   readonly projectId: string

   /**
    * Catalog of RegionMap friendly names to IPFS CIDs.
    * Shared across all permutation specs; each spec references names from here.
    */
   readonly regionMapCatalog: RegionMapCatalog

   /** Permutation groups to expand into painting tasks. */
   readonly permutationSpecs: PermutationSpec[]

   /** Optional timestamp when this spec was authored. */
   readonly createdAt?: number
}
