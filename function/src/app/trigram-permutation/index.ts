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

// Domain models for painting framework integration (bridging models)
export { TermPairSourceType } from "./models/paint/index.js"
export type {
   PrefixSuffixTermPairSource,
   AllPairsTermPairSource,
   TermPairSource,
   TrigramPaintTask,
   TrigramPaintProject,
} from "./models/paint/index.js"

// Expansion logic
export { expandToMultiTaskRequest } from "./logic/PermutationExpander.js"
