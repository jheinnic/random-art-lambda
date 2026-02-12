import { TermPairSourceType } from "./TermPairSourceType.js"

/*
 * Task-level domain model for individual trigram rendering
 */
export interface TrigramPaintTask {
   termPairSourceType: TermPairSourceType

   /**
    * This value should be in the model that the RandomArt framework maintains, but
    * it is presently excluded because the PaintingTask model is being reused in
    * multiple contexts, and they don't always occur in a context that would require
    * or even define an original project-scoped index of occurence.   The simplest
    * counter-example is the project-less single-painting task request.
    *
    * RA should reconcile this with what it does for Pipeline Context composition,
    * where it would compose a model providing master collection index retention on
    * a suitably named abstraction with the core abstraction for a painting task.
    *
    * This is a TODO note to eventually return to relying on the framework context
    * contribution to model this property instead of letting it live here ad infinitum.
    */
   paintProjectTaskIndex: number

   /**
    * Which Term Pair Source contributed this task
    */
   termPairSourceIndex: number

   /**
    * Which region map reference in that term pair source contributed this tasks's
    * region map.
    */
   regionMapIndex: number

   /**
    * Which expanded term pair in that term pair source controbuted this task's
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
