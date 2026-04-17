import { Inject, Injectable, Logger } from "@nestjs/common"
import { WorkerHost } from "@nestjs/bullmq"
import { Job, Worker } from "bullmq"

import { Envelope, type EnvelopeMemento } from "../../../messages/index.js"
import {
   CURRENT_RELEASE,
   PROJECT_MANIFEST_FILENAME,
   type GatherPaintedPartsResult,
   type GatherProjectTasksRequest,
   type GatherProjectTasksResult,
   type ProjectManifest,
   type ProjectManifestEntry,
   type StagedFileRef,
} from "../../messages/dto/index.js"
import {
   OutcomeType,
   type TaskResultRecord,
   type S3StagingReport,
   type LocalStagingReport,
   type DualStagingReport,
} from "../../messages/values/TaskResultRecord.js"
import type { IFileStore } from "../../../storage/interface/IFileStore.js"
import type { PaintTaskId } from "../../messages/values/PaintTaskId.js"
import { QueuedPaintingTypes } from "../di/Types.js"

const PROGRESS_FOR_MANIFEST_WRITE: number = 10
const PROGRESS_FOR_CHILD_COLLECTION: number = 100 - PROGRESS_FOR_MANIFEST_WRITE

// Local type aliases for cleaner signatures
type ProjectRequestMemento = EnvelopeMemento<GatherProjectTasksRequest<object>>
type ChildResultMemento = EnvelopeMemento<GatherPaintedPartsResult>
type ProjectResultEnvelope = Envelope<GatherProjectTasksResult>

/**
 * Worker that gathers all per-task results for a project and produces
 * a project manifest summarizing what was generated.
 *
 * This is the root of the FlowProducer tree. It runs after all per-task
 * gathering workers have completed (assembling chunks and staging images).
 *
 * NOTE: No static @Processor decorator - the queue name is applied dynamically
 * by the module configuration using Processor(queueName)(RandomArtProjectGatheringWorker).
 */
@Injectable()
export class RandomArtProjectGatheringWorker extends WorkerHost<
   Worker<ProjectRequestMemento, ProjectResultEnvelope>
> {
   private readonly logger: Logger

   constructor(
      @Inject(QueuedPaintingTypes.InjectedFileStore)
      private readonly fileStore: IFileStore,
   ) {
      super()
      this.logger = new Logger(
         "painting.queued.RandomArtProjectGatheringWorker",
      )
      this.logger.log("Created project gathering worker")
   }

   async process(
      job: Job<ProjectRequestMemento, ProjectResultEnvelope>,
   ): Promise<ProjectResultEnvelope> {
      this.logger.log(`Processing project gather job: ${job.name}`)

      // Step 1: Restore envelope from wire format
      const requestEnvelope: Envelope<GatherProjectTasksRequest<object>> =
         Envelope.fromWire<GatherProjectTasksRequest<object>, never>(
            job.data,
            CURRENT_RELEASE,
         )

      if (!requestEnvelope.isMessage) {
         return this.createErrorResult(
            requestEnvelope,
            "Invalid or error envelope received",
         )
      }

      // Step 2: Use handleWith for proper lifecycle management
      return await requestEnvelope.handleWith<GatherProjectTasksResult>(
         async (
            handling: Envelope<GatherProjectTasksRequest<object>>,
         ): Promise<GatherProjectTasksResult> => {
            const request: GatherProjectTasksRequest<object> =
               handling.getPayload()
            const { projectId, expectedTaskCount, projectDomain } = request

            this.logger.log(
               `Project ${projectId}: Gathering ${expectedTaskCount} task results`,
            )

            // Step 3: Collect all child results
            const childData: Record<string, ChildResultMemento> =
               await job.getChildrenValues()
            const childKeys: string[] = Object.keys(childData)

            if (childKeys.length === 0) {
               throw new Error(
                  `Project ${projectId}: No child task results received`,
               )
            }

            // Step 4: Process child results into manifest entries and counters
            let progress: number = 0
            const progressPerChild: number =
               PROGRESS_FOR_CHILD_COLLECTION / childKeys.length

            const resultsByTask: Record<PaintTaskId, TaskResultRecord> =
               {} satisfies Record<PaintTaskId, TaskResultRecord>
            const manifestEntries: ProjectManifestEntry[] = []
            const counters = {
               totalTaskCount: expectedTaskCount,
               numCompleted: 0,
               numStaged: 0,
               numCached: 0,
               numIgnored: 0,
               numFatalErrors: 0,
               numSemanticErrors: 0,
               numRetryFailures: 0,
            }

            for (const [childKey, childMemento] of Object.entries(childData)) {
               const childEnvelope: Envelope<GatherPaintedPartsResult> =
                  Envelope.fromWire<GatherPaintedPartsResult>(
                     childMemento,
                     CURRENT_RELEASE,
                  )

               if (!childEnvelope.isMessage) {
                  this.logger.warn(
                     `Project ${projectId}: Skipping invalid child result ${childKey}`,
                  )
                  counters.numFatalErrors++
                  continue
               }

               const partResult: GatherPaintedPartsResult =
                  childEnvelope.getPayload()
               const { taskId, result, domainExtension, regionMapName } =
                  partResult

               // Track result by task
               resultsByTask[taskId] = result

               // Update counters
               this.updateCounters(counters, result)

               // Build manifest entry
               manifestEntries.push(
                  this.buildManifestEntry(
                     taskId,
                     result,
                     domainExtension,
                     regionMapName,
                  ),
               )

               progress += progressPerChild
               await job.updateProgress(Math.floor(progress))
            }

            this.logger.log(
               `Project ${projectId}: Collected ${childKeys.length} results ` +
                  `(${counters.numCompleted} completed, ${counters.numFatalErrors} errors)`,
            )

            // Step 5: Build and write the project manifest
            const manifest: ProjectManifest = {
               projectId,
               generatedAt: new Date().toISOString(),
               counters,
               projectDomain,
               tasks: manifestEntries,
            }

            const manifestPath = `${projectId}/${PROJECT_MANIFEST_FILENAME}`
            const manifestJson = JSON.stringify(manifest, null, 2)
            const manifestBuffer = Buffer.from(manifestJson, "utf-8")

            await this.fileStore.write(manifestPath, manifestBuffer, {
               contentType: "application/json",
            })

            await job.updateProgress(100)
            this.logger.log(
               `Project ${projectId}: Manifest written to ${manifestPath}`,
            )

            // Step 6: Return the project gather result
            return {
               projectId,
               resultsByTask,
               resultsByGroup: {}, // TODO: Group by region map or other criteria
               counters,
            }
         },
      )
   }

   private updateCounters(
      counters: GatherProjectTasksResult["counters"] & {
         numCompleted: number
         numStaged: number
         numCached: number
         numIgnored: number
         numFatalErrors: number
         numSemanticErrors: number
         numRetryFailures: number
      },
      result: TaskResultRecord,
   ): void {
      switch (result.outcomeType) {
         case OutcomeType.OK:
            counters.numCompleted++
            if (result.reportIfCompleted != null) {
               counters.numStaged++
            }
            break
         case OutcomeType.IGNORED:
            counters.numIgnored++
            break
         case OutcomeType.SEMANTIC_ERROR:
            counters.numSemanticErrors++
            break
         case OutcomeType.FATAL_ERROR:
            counters.numFatalErrors++
            break
         case OutcomeType.OUT_OF_RETRIES:
            counters.numRetryFailures++
            break
      }
   }

   private buildManifestEntry(
      taskId: PaintTaskId,
      result: TaskResultRecord,
      domainExtension?: object,
      regionMapName?: string,
   ): ProjectManifestEntry {
      const entry: ProjectManifestEntry = {
         taskId,
         outcomeType: result.outcomeType,
         domainExtension,
         regionMapName,
         stagedFile: this.extractStagedFileRef(result),
         errorIfFailed: result.errorIfFailed,
      }

      return entry
   }

   /**
    * Extract a normalized StagedFileRef from the TaskResultRecord's
    * report, which may be a LocalStagingReport, S3StagingReport,
    * or DualStagingReport depending on the stager implementation.
    */
   private extractStagedFileRef(
      result: TaskResultRecord,
   ): StagedFileRef | undefined {
      if (
         result.outcomeType !== OutcomeType.OK ||
         result.reportIfCompleted == null
      ) {
         return undefined
      }

      const report = result.reportIfCompleted as
         | LocalStagingReport
         | S3StagingReport
         | DualStagingReport
      const ref: StagedFileRef = {
         path: "primaryPath" in report ? report.primaryPath : undefined,
         s3: "primaryObject" in report ? report.primaryObject : undefined,
         fileSizeKb: report.fileSizeKb,
      }

      return ref
   }

   /**
    * Create an error result envelope when the request envelope is invalid.
    */
   private createErrorResult(
      requestEnvelope: Envelope<GatherProjectTasksRequest<object>>,
      errorMessage: string,
   ): ProjectResultEnvelope {
      this.logger.error(errorMessage)

      requestEnvelope.beginHandling()
      const replyEnvelope =
         requestEnvelope.startReplying<GatherProjectTasksResult>()

      const errorResult: GatherProjectTasksResult = {
         projectId: "" as any,
         resultsByTask: {},
         resultsByGroup: {},
         counters: {
            totalTaskCount: 0,
            numCompleted: 0,
            numStaged: 0,
            numCached: 0,
            numIgnored: 0,
            numFatalErrors: 0,
            numSemanticErrors: 0,
            numRetryFailures: 0,
         },
      }

      replyEnvelope.commitBody(errorResult)
      requestEnvelope.endHandling()

      return replyEnvelope
   }
}
