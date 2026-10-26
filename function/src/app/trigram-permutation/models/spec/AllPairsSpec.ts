import { PermutationSpecType } from "./PermutationSpecType.js"

/**
 * All-Pairs permutation spec.
 * Generates ordered pairs from a single source list × regionMaps.
 *
 * For n source elements and r regionMaps:
 * - includeIdentity=false: n(n-1) × r pairs
 * - includeIdentity=true:  n² × r pairs
 */
export interface AllPairsSpec {
   readonly expandType: PermutationSpecType.AllPairs

   /**
    * Names of RegionMaps from the project-level catalog to render with.
    * Each term pair is rendered once per RegionMap.
    */
   readonly regionMapNames: string[]

   /** Terms from which prefix/suffix pairs are drawn. */
   readonly sourceTrigrams: string[]

   /** Include identity pairs where prefix === suffix. Defaults to false. */
   readonly includeIdentity?: boolean
}
