/**
 * Activity Response Types
 *
 * Defines the response structures that flow from activity pipelines
 * back through the GatheringWorker to the Envelope response.
 *
 * Design:
 * - ActivityExecutionResult (existing) captures per-unit outcomes
 * - GatheringActivityReport extends this with image-specific metadata
 * - EnvelopeResponseMetadata maps to the wire format for Envelope.commitBody()
 */

import type { PaintTaskId } from "../../messages/values/PaintTaskId.js"
import type { ULIDString } from "../../../messages/interface/NamedValues.js"

// ============================================================================
// Per-Activity Report
// ============================================================================

/**
 * Report from a single activity unit execution.
 * This is what each @ActivityUnit returns from its execute() method.
 */
export interface ActivityUnitReport {
   /** Fields provided by this activity (merged into context) */
   readonly outputs?: Record<string, unknown>
   /** Human-readable summary of what was done */
   readonly summary?: string
   /** Any metrics collected during execution */
   readonly metrics?: ActivityMetrics
}

/**
 * Common metrics that activities may report.
 */
export interface ActivityMetrics {
   /** Bytes written/uploaded */
   readonly bytesWritten?: number
   /** Bytes read/downloaded */
   readonly bytesRead?: number
   /** Number of items processed */
   readonly itemCount?: number
   /** Custom metrics */
   readonly custom?: Record<string, number>
}

// ============================================================================
// Pipeline Aggregation
// ============================================================================

/**
 * Individual activity result within the pipeline.
 * Extends the execution result with typed report access.
 */
export interface ActivityResult<TReport extends ActivityUnitReport = ActivityUnitReport> {
   /** Name of the activity unit */
   readonly unitName: string
   /** Human-readable label (from @ActivityUnit metadata) */
   readonly label?: string
   /** Whether execution succeeded */
   readonly success: boolean
   /** Duration in milliseconds */
   readonly durationMs: number
   /** The typed report if successful */
   readonly report?: TReport
   /** Error message if failed */
   readonly error?: string
}

/**
 * Aggregated result from the full activity pipeline.
 */
export interface GatheringPipelineResult {
   /** Overall success - all activities must succeed */
   readonly success: boolean
   /** Outcome status for response classification */
   readonly status: GatheringStatus
   /** Results from each activity in execution order */
   readonly activityResults: ActivityResult[]
   /** Total pipeline execution duration */
   readonly totalDurationMs: number
   /** Final accumulated context (for debugging/logging) */
   readonly finalContext?: Record<string, unknown>
}

/**
 * Status classification for gathering outcomes.
 */
export enum GatheringStatus {
   /** All activities completed successfully */
   SUCCESS = "success",
   /** Some activities succeeded, some failed (if not fail-fast) */
   PARTIAL = "partial",
   /** Pipeline failed (first activity failure in fail-fast mode) */
   FAILED = "failed",
   /** No activities were configured/executed */
   EMPTY = "empty",
}

// ============================================================================
// Envelope Response Payload
// ============================================================================

/**
 * The response payload committed to the Envelope.
 * This is what the GatheringWorker returns to complete the flow.
 */
export interface GatheringResponse {
   /** The task that was processed */
   readonly taskId: PaintTaskId
   /** Correlation ID from the original request */
   readonly correlationId: ULIDString
   /** Overall outcome */
   readonly status: GatheringStatus
   /** Whether the painting was successfully gathered */
   readonly success: boolean
   /** Summary of what happened */
   readonly summary: string
   /** Per-activity outcomes */
   readonly activities: ActivitySummary[]
   /** Total processing time (painting + activities) */
   readonly totalDurationMs: number
   /** Timing breakdown */
   readonly timing: GatheringTiming
   /** Output locations/references (from activity provides) */
   readonly outputs: GatheringOutputs
}

/**
 * Summary of a single activity for the response.
 */
export interface ActivitySummary {
   /** Activity name */
   readonly name: string
   /** Human-readable label */
   readonly label?: string
   /** Success/failure */
   readonly success: boolean
   /** Duration in ms */
   readonly durationMs: number
   /** Brief description of outcome */
   readonly summary?: string
   /** Error message if failed */
   readonly error?: string
}

/**
 * Timing breakdown for the gathering operation.
 */
export interface GatheringTiming {
   /** Time spent painting (all parts) */
   readonly paintingMs: number
   /** Time spent assembling painted parts */
   readonly assemblyMs: number
   /** Time spent in activity pipeline */
   readonly activitiesMs: number
   /** Total wall-clock time */
   readonly totalMs: number
}

/**
 * Output references from the activity pipeline.
 * Populated from activity "provides" fields.
 */
export interface GatheringOutputs {
   /** Primary staged file path (if file staging activity ran) */
   readonly stagedPath?: string
   /** Content hash of the rendered image (if computed) */
   readonly contentHash?: string
   /** S3/storage location (if uploaded) */
   readonly storageLocation?: string
   /** Pre-signed URL (if generated) */
   readonly presignedUrl?: string
   /** Additional outputs from custom activities */
   readonly custom?: Record<string, unknown>
}

// ============================================================================
// Error Response
// ============================================================================

/**
 * Error response when gathering fails completely.
 */
export interface GatheringErrorResponse {
   /** The task that failed */
   readonly taskId: PaintTaskId
   /** Correlation ID from the original request */
   readonly correlationId: ULIDString
   /** Always "failed" for error responses */
   readonly status: GatheringStatus.FAILED
   /** Always false for error responses */
   readonly success: false
   /** Error message */
   readonly error: string
   /** Error code for programmatic handling */
   readonly errorCode: GatheringErrorCode
   /** Which stage failed */
   readonly failedStage: GatheringStage
   /** Partial timing if available */
   readonly timing?: Partial<GatheringTiming>
}

/**
 * Error codes for gathering failures.
 */
export enum GatheringErrorCode {
   /** Failed to receive/decode painted parts */
   PARTS_RECEPTION_FAILED = "PARTS_RECEPTION_FAILED",
   /** Failed to assemble painted parts into image */
   ASSEMBLY_FAILED = "ASSEMBLY_FAILED",
   /** Activity pipeline failed */
   ACTIVITY_FAILED = "ACTIVITY_FAILED",
   /** Timeout during processing */
   TIMEOUT = "TIMEOUT",
   /** Internal error */
   INTERNAL_ERROR = "INTERNAL_ERROR",
}

/**
 * Stages where gathering can fail.
 */
export enum GatheringStage {
   RECEIVING = "receiving",
   ASSEMBLY = "assembly",
   ACTIVITIES = "activities",
   RESPONSE = "response",
}
