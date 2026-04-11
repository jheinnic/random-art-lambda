import type { PermutationPaintTask } from "../spec/PermutationInputSpec.js"
import { TermPairSourceType } from "./TermPairSourceType.js"

/**
 * Task-level domain model for individual trigram rendering
 *
 * Extends PermutationPaintTask to inherit resolvedFileNameExpression
 * and inputEncoding from the mid-tier permutation framework.
 */
export interface TrigramPaintTask extends PermutationPaintTask {
   /**
    * Flat ordinal of this task within the project.
    *
    * This property is the wire serialization form of ProjectPositionPart's
    * `paintProjectTaskIndex`. The framework context part provides the
    * canonical worker-side access path; this property remains for wire
    * transport and manifest persistence.
    */
   paintProjectTaskIndex: number

   /**
    * Which region map reference in that term pair source contributed this
    * task's region map.
    *
    * This property is the wire serialization form of ProjectPositionPart's
    * `regionMapIndex`. The framework context part provides the canonical
    * worker-side access path; this property remains for wire transport
    * and manifest persistence.
    */
   regionMapIndex: number

   /**
    * Which Term Pair Source contributed this task
    */
   termPairSourceIndex: number

   termPairSourceType: TermPairSourceType

   /**
    * Which expanded term pair in that term pair source contributed this task's
    * prefix/suffix pairing.
    */
   termPairIndex: number

   /**
    * The prefix trigram the extended task is painting in its human-readable
    * utf-8 encoding (e.g., "☰☱☲")
    */
   prefixTrigram: string

   /**
    * What index in either a prefixList or a general trigramList contributed this
    * task's prefix trigram.
    */
   prefixIndex: number

   /**
    * The suffix trigram the extended task is painting in its human-readable
    * utf-8 encoding (e.g., "☰☱☲")
    */
   suffixTrigram: string

   /**
    * What index in either a prefixList or a general trigramList contributed this
    * task's suffix trigram.
    */
   suffixIndex: number
}
