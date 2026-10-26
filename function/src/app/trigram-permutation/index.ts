/**
 * Trigram Permutation Gallery - Public API
 *
 * Export models and logic for use by other modules
 */

// Models
export { PermutationSpecType } from "./models/spec/index.js"
export type {
   PrefixSuffixSpec,
   AllPairsSpec,
   PermutationSpec,
   RegionMapCatalog,
   TrigramProjectSpec,
} from "./models/spec/index.js"

// Expansion logic (Trigram has no paint model; it expands to the Permutations layer's spec)
export { expandToPermutationsSpec } from "./logic/PermutationExpander.js"
