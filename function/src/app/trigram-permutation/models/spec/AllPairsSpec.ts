import { PermutationSpecType } from "./PermutationSpecType.js"

/**
 * All-Pairs permutation spec
 * Generates ordered pairs from a single source list × regionMaps
 *
 * This expander produces the Cartesian product of sources × sources × regionMaps,
 * optionally excluding identity pairs where both elements are the same.
 *
 * For n source elements and r regionMaps:
 * - includeIdentity=false: (n² - n) × r = n(n-1) × r pairs
 * - includeIdentity=true:  n² × r pairs
 *
 * Example:
 * {
 *   "expandType": "permuteAllPairs",
 *   "regionMapNames": ["standard-view"],
 *   "sources": ["☰", "☱", "☲"],
 *   "includeIdentity": false
 * }
 *
 * With includeIdentity=false (default), n=3, r=1 gives (3²-3) × 1 = 6 pairs:
 * ☰☱, ☰☲, ☱☰, ☱☲, ☲☰, ☲☱
 *
 * With includeIdentity=true, n=3, r=1 gives 3² × 1 = 9 pairs:
 * ☰☰, ☰☱, ☰☲, ☱☰, ☱☱, ☱☲, ☲☰, ☲☱, ☲☲
 *
 * With multiple regionMaps (r=2), each pair count is doubled.
 */
export interface AllPairsSpec {
   expandType: PermutationSpecType.AllPairs

   /**
    * Names of RegionMaps from the project-level catalog to render with.
    * Each source pair is rendered once per RegionMap.
    */
   regionMapNames: string[]
   /**
    * The collection of terms from which seed model pairs will be taken.
    */
   sourceTrigrams: string[]
   /**
    * Include identity pairs where both elements are the same (e.g., ☰☰)
    * Defaults to false
    */
   includeIdentity?: boolean
}
