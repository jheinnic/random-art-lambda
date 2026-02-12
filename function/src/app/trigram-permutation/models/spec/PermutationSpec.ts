import { AllPairsSpec } from "./AllPairsSpec.js"
import { PrefixSuffixSpec } from "./PrefixSuffixSpec.js"

/**
 * Union type for all permutation specifications
 */
export type PermutationSpec = PrefixSuffixSpec | AllPairsSpec
