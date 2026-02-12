import { PermutationSpecType } from "./PermutationSpecType.js"

/**
 * Prefix-Suffix permutation spec
 * Generates Cartesian product of prefixes × suffixes × regionMaps
 *
 * For p prefixes, s suffixes, and r regionMaps:
 * Total tasks = p × s × r
 *
 * Example with single RegionMap:
 * {
 *   "expandType": "permutePrefixSuffix",
 *   "regionMapNames": ["bagua-8-region"],
 *   "prefixes": ["☰", "☱"],
 *   "suffixes": ["☰", "☱", "☲"]
 * }
 * Generates: 2 × 3 × 1 = 6 tasks
 *
 * Example with multiple RegionMaps (for multi-resolution or multi-viewport):
 * {
 *   "expandType": "permutePrefixSuffix",
 *   "regionMapNames": ["bagua-thumbnail", "bagua-detail", "bagua-zoomed"],
 *   "prefixes": ["☰", "☱"],
 *   "suffixes": ["☰", "☱", "☲"]
 * }
 * Generates: 2 × 3 × 3 = 18 tasks
 *
 * The regionMapNames reference keys in the project-level regionMapCatalog.
 */
export interface PrefixSuffixSpec {
   expandType: PermutationSpecType.PrefixSuffix

   /**
    * Names of RegionMaps from the project-level catalog to render with.
    * Each trigram pair is rendered once per RegionMap.
    */
   regionMapNames: string[]

   prefixTrigrams: string[]

   suffixTrigrams: string[]
}
