import { TermPairSource } from "./TermPairSource.js"

/**
 * Project-level domain model for Trigram Permutation Gallery
 */
export interface TrigramPaintProject {
   /**
    * Total number of permutation spec groups
    */
   termPairSourceCount: number

   /**
    * Total number of tasks in this project
    */
   taskCount: number

   /**
    * Total number of RegionMaps available to each PermutationSpec.
    */
   regionMapCount: number

   termPairSources: TermPairSource[]
}
