/**
 * Image File Staging Activity
 *
 * Example activity unit that stages the assembled image to file storage.
 * Demonstrates:
 * - Using @ActivityUnit decorator with requires/provides
 * - Injecting private dependencies (IFileStore) via NestJS DI
 * - Accessing public context values (pathName from expression evaluation)
 * - Returning a typed report
 */

import { Injectable, Inject } from "@nestjs/common"
import * as crypto from "crypto"

import {
   ActivityUnit,
   ExecutionLocation,
   ConfigSource,
   type IActivityUnit,
} from "./ActivityUnitAnnotations.js"
import type { ActivityUnitReport, ActivityMetrics } from "./ActivityResponseTypes.js"
import { Capabilities, requires } from "./WorkerCapabilities.js"
import { TenantIsolationLevel } from "./TenantRouting.js"

import {
   FILE_STORE_TOKEN,
   type IFileStore,
} from "../context/parts/FileStorePart.js"

// ============================================================================
// Context Type (what this activity receives)
// ============================================================================

/**
 * The context this activity requires to execute.
 * These come from the accumulated context (base task + expression parts).
 */
export interface ImageStagingContext {
   /** The assembled image buffer (added by GatheringWorkerBridge) */
   readonly imageBuffer: Buffer
   /** Computed path from PathNamingPart expression */
   readonly pathName: string
   /** Task ID for logging/tracing */
   readonly taskId: string
}

// ============================================================================
// Report Type (what this activity returns)
// ============================================================================

/**
 * Report from the file staging activity.
 * Fields listed in @ActivityUnit.provides get merged into context.
 */
export interface ImageStagingReport extends ActivityUnitReport {
   /** Where the file was staged */
   readonly stagedPath: string
   /** SHA-256 hash of the image content */
   readonly contentHash: string
   /** Bytes written */
   readonly bytesWritten: number
   /** Human-readable summary */
   readonly summary: string
   /** Metrics for observability */
   readonly metrics: ActivityMetrics
}

// ============================================================================
// Activity Implementation
// ============================================================================

/**
 * Stages the assembled image to file storage.
 *
 * This is a WORKER_OK activity - it can run on any worker node because:
 * - The file store is injected (could be S3, local, etc.)
 * - The path name comes from expression evaluation (computed on worker)
 * - No local resources are required
 *
 * @example
 * ```typescript
 * // In a NestJS module:
 * @Module({
 *    providers: [
 *       ImageFileStagingActivity,
 *       {
 *          provide: FILE_STORE_TOKEN,
 *          useClass: S3FileStore,  // or LocalFileStore for dev
 *       },
 *    ],
 * })
 * export class StagingModule {}
 * ```
 */
@Injectable()
@ActivityUnit({
   name: "ImageFileStaging",
   executionLocation: ExecutionLocation.WORKER_OK,
   priority: 100, // Run early in the pipeline
   configSource: ConfigSource.OPERATOR, // File store config is operator-provided
   reportLabel: "File Staging",
   requires: ["imageBuffer", "pathName"],
   provides: ["stagedPath", "contentHash"],
   // Capability-based routing: requires FILE_STORE capability
   // FlowProducer routes to workers that have a matching FileStore
   capabilities: [requires.required(Capabilities.FILE_STORE)],
   // REQUIRED: FileStore uses tenant credentials (S3 bucket per tenant)
   tenantIsolation: TenantIsolationLevel.REQUIRED,
})
export class ImageFileStagingActivity
   implements IActivityUnit<ImageStagingContext, ImageStagingReport>
{
   constructor(
      @Inject(FILE_STORE_TOKEN)
      private readonly fileStore: IFileStore, // PRIVATE - not in expressions
   ) {}

   async execute(context: ImageStagingContext): Promise<ImageStagingReport> {
      const { imageBuffer, pathName, taskId } = context

      // Compute content hash
      const contentHash = crypto
         .createHash("sha256")
         .update(imageBuffer)
         .digest("base64url")

      // Stage the file
      const stagedUri = await this.fileStore.write(pathName, imageBuffer, {
         contentType: "image/png",
         tags: {
            taskId,
            contentHash,
            timestamp: new Date().toISOString(),
         },
      })

      const bytesWritten = imageBuffer.length

      return {
         stagedPath: stagedUri,
         contentHash,
         bytesWritten,
         summary: `Staged ${bytesWritten} bytes to ${stagedUri}`,
         metrics: {
            bytesWritten,
            itemCount: 1,
         },
         outputs: {
            stagedPath: stagedUri,
            contentHash,
         },
      }
   }
}

// ============================================================================
// Alternative: HTTP Upload Activity
// ============================================================================

/**
 * Context for HTTP upload activity.
 */
export interface HttpUploadContext {
   readonly imageBuffer: Buffer
   /** Pre-signed URL (must be computed elsewhere or provided) */
   readonly presignedUrl: string
   readonly taskId: string
}

/**
 * Report from HTTP upload activity.
 */
export interface HttpUploadReport extends ActivityUnitReport {
   readonly uploadedUrl: string
   readonly httpStatus: number
   readonly summary: string
   readonly metrics: ActivityMetrics
}

/**
 * Uploads the image to a pre-signed URL.
 *
 * Use case: When the destination is determined externally (e.g., client
 * requests an upload URL, we paint and upload to that URL).
 *
 * This is also WORKER_OK - just needs HTTP access.
 */
@Injectable()
@ActivityUnit({
   name: "HttpImageUpload",
   executionLocation: ExecutionLocation.WORKER_OK,
   priority: 100,
   reportLabel: "HTTP Upload",
   requires: ["imageBuffer", "presignedUrl"],
   provides: ["uploadedUrl"],
   // Only needs network access - available on most workers
   capabilities: [requires.required(Capabilities.NETWORK)],
   // NONE: Pre-signed URL already encodes credentials - no tenant isolation needed
   tenantIsolation: TenantIsolationLevel.NONE,
})
export class HttpImageUploadActivity
   implements IActivityUnit<HttpUploadContext, HttpUploadReport>
{
   async execute(context: HttpUploadContext): Promise<HttpUploadReport> {
      const { imageBuffer, presignedUrl, taskId } = context

      // Perform the upload
      const response = await fetch(presignedUrl, {
         method: "PUT",
         body: new Uint8Array(imageBuffer),
         headers: {
            "Content-Type": "image/png",
            "Content-Length": String(imageBuffer.length),
            "X-Task-Id": taskId,
         },
      })

      if (!response.ok) {
         throw new Error(`HTTP upload failed: ${response.status} ${response.statusText}`)
      }

      // Extract the final URL (without query params)
      const uploadedUrl = new URL(presignedUrl)
      uploadedUrl.search = ""

      return {
         uploadedUrl: uploadedUrl.toString(),
         httpStatus: response.status,
         summary: `Uploaded ${imageBuffer.length} bytes to ${uploadedUrl.hostname}`,
         metrics: {
            bytesWritten: imageBuffer.length,
            itemCount: 1,
         },
         outputs: {
            uploadedUrl: uploadedUrl.toString(),
         },
      }
   }
}

// ============================================================================
// Alternative: Multi-Destination Activity
// ============================================================================

/**
 * Context for multi-destination staging.
 */
export interface MultiDestinationContext {
   readonly imageBuffer: Buffer
   readonly pathName: string
   readonly taskId: string
   /** Optional: additional destinations */
   readonly additionalPaths?: string[]
}

/**
 * Report from multi-destination staging.
 */
export interface MultiDestinationReport extends ActivityUnitReport {
   readonly stagedPaths: string[]
   readonly contentHash: string
   readonly totalBytesWritten: number
   readonly summary: string
   readonly metrics: ActivityMetrics
}

/**
 * Stages to multiple destinations (e.g., primary + backup, different regions).
 */
@Injectable()
@ActivityUnit({
   name: "MultiDestinationStaging",
   executionLocation: ExecutionLocation.WORKER_OK,
   priority: 100,
   reportLabel: "Multi-Destination Staging",
   requires: ["imageBuffer", "pathName"],
   provides: ["stagedPaths", "contentHash"],
   // Requires FILE_STORE capability for all destinations
   capabilities: [requires.required(Capabilities.FILE_STORE)],
   // REQUIRED: FileStore uses tenant credentials
   tenantIsolation: TenantIsolationLevel.REQUIRED,
})
export class MultiDestinationStagingActivity
   implements IActivityUnit<MultiDestinationContext, MultiDestinationReport>
{
   constructor(
      @Inject(FILE_STORE_TOKEN)
      private readonly fileStore: IFileStore,
   ) {}

   async execute(context: MultiDestinationContext): Promise<MultiDestinationReport> {
      const { imageBuffer, pathName, taskId, additionalPaths = [] } = context

      // Compute content hash once
      const contentHash = crypto
         .createHash("sha256")
         .update(imageBuffer)
         .digest("base64url")

      // All paths to write to
      const allPaths = [pathName, ...additionalPaths]

      // Write to all destinations in parallel
      const stagedPaths = await Promise.all(
         allPaths.map((path) =>
            this.fileStore.write(path, imageBuffer, {
               contentType: "image/png",
               tags: { taskId, contentHash },
            }),
         ),
      )
      const totalBytesWritten = imageBuffer.length * allPaths.length

      return {
         stagedPaths,
         contentHash,
         totalBytesWritten,
         summary: `Staged to ${allPaths.length} destination(s): ${stagedPaths.join(", ")}`,
         metrics: {
            bytesWritten: totalBytesWritten,
            itemCount: allPaths.length,
         },
         outputs: {
            stagedPaths,
            contentHash,
         },
      }
   }
}
