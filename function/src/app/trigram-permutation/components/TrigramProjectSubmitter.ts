import { Injectable, Inject, Logger } from "@nestjs/common"
import { PermutationExpander } from "../logic/PermutationExpander.js"
import { RandomArtFlowProducer } from "../../../painting/queue/components/RandomArtFlowProducer.js"
import { TrigramModuleTypes } from "../di/Types.js"
import type { TrigramProjectSpec } from "../models/spec/index.js"
import type { TrigramPaintProject } from "../models/paint/TrigramPaintProject.js"
import type { TrigramPaintTask } from "../models/paint/TrigramPaintTask.js"

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
      private readonly flowProducer: RandomArtFlowProducer<
         TrigramPaintTask,
         TrigramPaintProject
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

      // Step 1: Expand spec to multi-task request
      const request = this.expander.expandToMultiTaskRequest(spec)

      this.logger.log(
         `Expanded to ${request.taskUnits.length} tasks across ${request.projectDomain.termPairSourceCount} term pair sources`,
      )

      // Step 2: Submit to the flow producer
      const reply = await this.flowProducer.submitProject(request)

      this.logger.log(
         `Project ${reply.projectId} submitted with ${reply.taskIds.length} tasks`,
      )

      return {
         projectId: reply.projectId,
         taskCount: reply.taskIds.length,
         taskIds: reply.taskIds,
      }
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
         const request = this.expander.expandToMultiTaskRequest(spec)
         return {
            valid: true,
            taskCount: request.taskUnits.length,
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
