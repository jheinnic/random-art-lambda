/**
 * Gathering Worker Bridge
 *
 * Provides the clean handoff between the GatheringWorker and the activity pipeline.
 *
 * Design Principles:
 * - GatheringWorker is unaware of what happens to the assembled image
 * - The bridge receives the image and context, runs activities, returns a response
 * - Response structure maps directly to Envelope.commitBody()
 *
 * Usage:
 * ```typescript
 * @Injectable()
 * class RandomArtGatheringWorker {
 *    constructor(
 *       private readonly bridge: GatheringWorkerBridge,
 *       @Inject(CONTEXT_FACTORY_TOKEN)
 *       private readonly contextFactory: IContextFactory,
 *    ) {}
 *
 *    async handleGatherRequest(envelope: Envelope<GatherRequest>) {
 *       return envelope.handleWith(async (env) => {
 *          const request = env.getPayload()
 *          const context = this.contextFactory.create(request.baseTask)
 *
 *          // ... paint and assemble the image ...
 *          const imageBuffer = await this.assembleImage(paintedParts)
 *
 *          // Hand off to the bridge - GatheringWorker doesn't know/care what happens next
 *          return this.bridge.processAssembledImage({
 *             imageBuffer,
 *             context,
 *             taskId: request.taskId,
 *             correlationId: env.correlationId,
 *             timing: { paintingMs, assemblyMs },
 *          })
 *       })
 *    }
 * }
 * ```
 */

import { Injectable, Logger } from "@nestjs/common"

import {
   ActivityUnitExecutor,
   type PipelineExecutionConfig,
   type PipelineExecutionResult,
} from "./ActivityUnitExecutor.js"
import { getActivityUnitMetadata } from "./ActivityUnitAnnotations.js"
import type {
   GatheringResponse,
   GatheringErrorResponse,
   GatheringPipelineResult,
   GatheringTiming,
   GatheringOutputs,
   ActivitySummary,
   ActivityResult,
} from "./ActivityResponseTypes.js"
import {
   GatheringStatus,
   GatheringErrorCode,
   GatheringStage,
} from "./ActivityResponseTypes.js"

import type { PaintTaskId } from "../../messages/values/PaintTaskId.js"
import type { ULIDString } from "../../../messages/interface/NamedValues.js"
import type { MiddlewareContext } from "../context/Contextualize.js"

// ============================================================================
// Handoff Types
// ============================================================================

/**
 * The assembled image handoff from GatheringWorker to the activity pipeline.
 *
 * This is the contract: "Here's the image and context, tell me what to do with it."
 */
export interface AssembledImageHandoff {
   /** The assembled image buffer (PNG/JPEG/etc) */
   readonly imageBuffer: Buffer
   /** The accumulated middleware context */
   readonly context: MiddlewareContext<object, object>
   /** Task identifier */
   readonly taskId: PaintTaskId
   /** Correlation ID for tracing */
   readonly correlationId: ULIDString
   /** Timing from painting phase */
   readonly timing: {
      /** Time spent painting all parts */
      readonly paintingMs: number
      /** Time spent assembling parts into final image */
      readonly assemblyMs: number
   }
}

/**
 * Configuration for the bridge.
 */
export interface GatheringBridgeConfig {
   /** Whether to include final context in response (for debugging) */
   readonly includeContextInResponse?: boolean
   /** Pipeline execution config */
   readonly pipelineConfig?: PipelineExecutionConfig
}

// ============================================================================
// Bridge Implementation
// ============================================================================

/**
 * The bridge between GatheringWorker and Activity Pipeline.
 *
 * GatheringWorker calls this with the assembled image.
 * The bridge runs activities and returns a response suitable for Envelope.commitBody().
 */
@Injectable()
export class GatheringWorkerBridge {
   private readonly logger = new Logger("GatheringWorkerBridge")

   constructor(private readonly executor: ActivityUnitExecutor) {}

   /**
    * Process an assembled image through the activity pipeline.
    *
    * @param handoff - The assembled image and context from GatheringWorker
    * @param config - Optional configuration
    * @returns Response payload ready for Envelope.commitBody()
    */
   async processAssembledImage(
      handoff: AssembledImageHandoff,
      config: GatheringBridgeConfig = {},
   ): Promise<GatheringResponse | GatheringErrorResponse> {
      const startTime = Date.now()
      const { includeContextInResponse = false, pipelineConfig = {} } = config

      try {
         // Build the activity context by merging the middleware context with the image
         const activityContext = this.buildActivityContext(handoff)

         // Execute the activity pipeline
         const pipelineResult = await this.executor.executePipeline(
            activityContext,
            undefined, // Use all registered activities
            {
               verbose: pipelineConfig.verbose ?? false,
               failFast: pipelineConfig.failFast ?? true,
               ...pipelineConfig,
            },
         )

         // Map pipeline result to response
         return this.buildSuccessResponse(
            handoff,
            pipelineResult,
            startTime,
            includeContextInResponse,
         )
      } catch (error) {
         this.logger.error(
            `Activity pipeline failed for task ${handoff.taskId}: ${error}`,
         )
         return this.buildErrorResponse(
            handoff,
            error instanceof Error ? error : new Error(String(error)),
            GatheringStage.ACTIVITIES,
            startTime,
         )
      }
   }

   /**
    * Build the context object passed to activities.
    * Merges middleware context with the image buffer.
    */
   private buildActivityContext(
      handoff: AssembledImageHandoff,
   ): Record<string, unknown> {
      const ctx = handoff.context

      return {
         // Spread public context
         ...ctx.context,
         // Add the image buffer (activities can access this)
         imageBuffer: handoff.imageBuffer,
         // Add task metadata
         taskId: handoff.taskId,
         correlationId: handoff.correlationId,
         // Methods are available for activities that need them
         _methods: ctx._methods,
      }
   }

   /**
    * Build a success response from the pipeline result.
    */
   private buildSuccessResponse(
      handoff: AssembledImageHandoff,
      pipelineResult: PipelineExecutionResult,
      startTime: number,
      includeContext: boolean,
   ): GatheringResponse {
      const totalMs = Date.now() - startTime

      // Determine status
      const status = this.determineStatus(pipelineResult)

      // Extract activity summaries
      const activities = this.extractActivitySummaries(pipelineResult)

      // Extract outputs from final context
      const outputs = this.extractOutputs(pipelineResult.finalContext)

      // Build timing breakdown
      const timing: GatheringTiming = {
         paintingMs: handoff.timing.paintingMs,
         assemblyMs: handoff.timing.assemblyMs,
         activitiesMs: pipelineResult.totalDurationMs,
         totalMs,
      }

      // Build summary
      const summary = this.buildSummary(status, activities)

      const response: GatheringResponse = {
         taskId: handoff.taskId,
         correlationId: handoff.correlationId,
         status,
         success: status === GatheringStatus.SUCCESS,
         summary,
         activities,
         totalDurationMs: totalMs,
         timing,
         outputs,
      }

      return response
   }

   /**
    * Build an error response.
    */
   private buildErrorResponse(
      handoff: AssembledImageHandoff,
      error: Error,
      stage: GatheringStage,
      startTime: number,
   ): GatheringErrorResponse {
      const totalMs = Date.now() - startTime

      return {
         taskId: handoff.taskId,
         correlationId: handoff.correlationId,
         status: GatheringStatus.FAILED,
         success: false,
         error: error.message,
         errorCode: this.mapErrorToCode(error, stage),
         failedStage: stage,
         timing: {
            paintingMs: handoff.timing.paintingMs,
            assemblyMs: handoff.timing.assemblyMs,
            totalMs,
         },
      }
   }

   /**
    * Determine the overall status from pipeline results.
    */
   private determineStatus(result: PipelineExecutionResult): GatheringStatus {
      if (result.unitResults.length === 0) {
         return GatheringStatus.EMPTY
      }
      if (result.success) {
         return GatheringStatus.SUCCESS
      }

      // Check if any succeeded (partial)
      const anySucceeded = result.unitResults.some((r) => r.success)
      return anySucceeded ? GatheringStatus.PARTIAL : GatheringStatus.FAILED
   }

   /**
    * Extract activity summaries from pipeline results.
    */
   private extractActivitySummaries(
      result: PipelineExecutionResult,
   ): ActivitySummary[] {
      return result.unitResults.map((unitResult) => {
         // Try to get the label from metadata (would need to track the class)
         const summary: ActivitySummary = {
            name: unitResult.unitName,
            success: unitResult.success,
            durationMs: unitResult.durationMs,
            error: unitResult.error,
         }

         // Extract summary from report if available
         if (unitResult.report && typeof unitResult.report === "object") {
            const report = unitResult.report as Record<string, unknown>
            if (typeof report.summary === "string") {
               return { ...summary, summary: report.summary }
            }
         }

         return summary
      })
   }

   /**
    * Extract known outputs from the final context.
    */
   private extractOutputs(
      finalContext: Record<string, unknown>,
   ): GatheringOutputs {
      const outputs: GatheringOutputs = {}
      const custom: Record<string, unknown> = {}

      // Extract known output fields
      if (typeof finalContext.stagedPath === "string") {
         ;(outputs as { stagedPath: string }).stagedPath = finalContext.stagedPath
      }
      if (typeof finalContext.contentHash === "string") {
         ;(outputs as { contentHash: string }).contentHash =
            finalContext.contentHash
      }
      if (typeof finalContext.storageLocation === "string") {
         ;(outputs as { storageLocation: string }).storageLocation =
            finalContext.storageLocation
      }
      if (typeof finalContext.presignedUrl === "string") {
         ;(outputs as { presignedUrl: string }).presignedUrl =
            finalContext.presignedUrl
      }

      // Collect any other outputs that aren't standard context fields
      const standardFields = new Set([
         "taskId",
         "correlationId",
         "imageBuffer",
         "_methods",
         "seedPrefix",
         "seedSuffix",
         "width",
         "height",
         "size",
         "pathName",
         "projectId",
         // Known outputs
         "stagedPath",
         "contentHash",
         "storageLocation",
         "presignedUrl",
      ])

      for (const [key, value] of Object.entries(finalContext)) {
         if (!standardFields.has(key) && value !== undefined) {
            custom[key] = value
         }
      }

      if (Object.keys(custom).length > 0) {
         ;(outputs as { custom: Record<string, unknown> }).custom = custom
      }

      return outputs
   }

   /**
    * Build a human-readable summary.
    */
   private buildSummary(
      status: GatheringStatus,
      activities: ActivitySummary[],
   ): string {
      const succeeded = activities.filter((a) => a.success).length
      const total = activities.length

      switch (status) {
         case GatheringStatus.SUCCESS:
            return `All ${total} activities completed successfully`
         case GatheringStatus.PARTIAL:
            return `${succeeded}/${total} activities completed, some failed`
         case GatheringStatus.FAILED:
            const failed = activities.find((a) => !a.success)
            return `Pipeline failed at ${failed?.name ?? "unknown"}: ${failed?.error ?? "unknown error"}`
         case GatheringStatus.EMPTY:
            return "No activities configured"
         default:
            return "Unknown status"
      }
   }

   /**
    * Map an error to an error code.
    */
   private mapErrorToCode(error: Error, stage: GatheringStage): GatheringErrorCode {
      // Could be more sophisticated based on error type
      switch (stage) {
         case GatheringStage.RECEIVING:
            return GatheringErrorCode.PARTS_RECEPTION_FAILED
         case GatheringStage.ASSEMBLY:
            return GatheringErrorCode.ASSEMBLY_FAILED
         case GatheringStage.ACTIVITIES:
            return GatheringErrorCode.ACTIVITY_FAILED
         default:
            return GatheringErrorCode.INTERNAL_ERROR
      }
   }
}
