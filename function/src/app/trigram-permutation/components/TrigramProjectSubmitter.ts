import { Injectable, Inject, Logger } from "@nestjs/common"
import { PermutationExpander } from "../logic/PermutationExpander.js"
import { RandomArtFlowProducer } from "../../../painting/queue/components/RandomArtFlowProducer.js"
import { TrigramModuleTypes } from "../di/Types.js"
import type { TrigramProjectSpec } from "../models/spec/index.js"
import type { PermutationsProjectSpec } from "../../../painting/permutations/spec/index.js"
import type {
   PermutationTaskPaint,
   PermutationProjectPaint,
} from "../../../painting/permutations/paint/index.js"

/** One painting task per (term pair × region map) in each group. */
function countPaintingTasks(spec: PermutationsProjectSpec): number {
   return spec.termGroups.reduce(
      (total, group) =>
         total + group.termPairs.length * group.regionMapNames.length,
      0,
   )
}

/**
 * Result of submitting a project
 */
export interface ProjectSubmissionResult {
   readonly projectId: string
   readonly taskCount: number
   readonly taskIds: string[]
}

/**
 * Service for submitting Trigram projects to the painting pipeline.
 *
 * This is the main entry point for the Trigram application to submit work.
 * It:
 * 1. Expands a TrigramProjectSpec into individual paint tasks
 * 2. Submits them to the BullMQ flow via RandomArtFlowProducer
 * 3. Returns the assigned task IDs for tracking
 *
 * Submission is currently disabled: the Permutations-layer PermutationsExpander that turns a
 * PermutationsProjectSpec into a request the RandomArtFlowProducer accepts is not written yet.
 * submitProject() rejects with an explanatory error; validateProject() still works.
 *
 * @example
 * const result = await submitter.submitProject(spec)
 * console.log(`Submitted ${result.taskCount} tasks for project ${result.projectId}`)
 */
@Injectable()
export class TrigramProjectSubmitter {
   private readonly logger = new Logger("TrigramProjectSubmitter")

   constructor(
      @Inject(TrigramModuleTypes.PermutationExpander)
      private readonly expander: PermutationExpander,
      @Inject(TrigramModuleTypes.RandomArtFlowProducer)
      // Kept injected (unused while submission is disabled) so re-enabling is a local change.
      private readonly flowProducer: RandomArtFlowProducer<
         PermutationTaskPaint,
         PermutationProjectPaint
      >,
   ) {}

   /**
    * Submit a Trigram project for painting.
    *
    * @param spec The project specification to expand and submit
    * @returns Submission result with assigned IDs
    */
   async submitProject(
      spec: TrigramProjectSpec,
   ): Promise<ProjectSubmissionResult> {
      this.logger.log(`Submitting project: ${spec.projectId}`)

      // Step 1: Expand spec to the Permutations layer's input
      const permutations = this.expander.expandToPermutationsSpec(spec)

      this.logger.log(
         `Expanded to ${countPaintingTasks(permutations)} tasks across ${permutations.termGroups.length} term groups`,
      )

      // Step 2 (disabled): PermutationsProjectSpec → flow producer request needs the
      // Permutations-layer PermutationsExpander, which does not exist yet.
      throw new Error(
         `Project submission is not implemented yet for "${spec.projectId}": ` +
            "the Permutations-layer PermutationsExpander that feeds RandomArtFlowProducer " +
            "has not been written. Use validateProject() for dry runs.",
      )
   }

   /**
    * Validate a project spec without submitting.
    * Useful for dry-runs and testing.
    *
    * @param spec The project specification to validate
    * @returns Validation result with task count
    */
   validateProject(spec: TrigramProjectSpec): {
      valid: boolean
      taskCount: number
      errors: string[]
   } {
      const errors: string[] = []

      try {
         const permutations = this.expander.expandToPermutationsSpec(spec)
         return {
            valid: true,
            taskCount: countPaintingTasks(permutations),
            errors: [],
         }
      } catch (error) {
         errors.push(error instanceof Error ? error.message : String(error))
         return {
            valid: false,
            taskCount: 0,
            errors,
         }
      }
   }
}
