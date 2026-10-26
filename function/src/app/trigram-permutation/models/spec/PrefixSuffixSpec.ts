import { PermutationSpecType } from "./PermutationSpecType.js"

/**
 * Prefix-Suffix permutation spec.
 * Generates the Cartesian product: prefixes × suffixes × regionMaps.
 *
 * For p prefixes, s suffixes, and r regionMaps: total tasks = p × s × r.
 */
export interface PrefixSuffixSpec {
   readonly expandType: PermutationSpecType.PrefixSuffix

   /**
    * Names of RegionMaps from the project-level catalog to render with.
    * Each term pair is rendered once per RegionMap.
    */
   readonly regionMapNames: string[]

   readonly prefixTrigrams: string[]

   readonly suffixTrigrams: string[]
}
