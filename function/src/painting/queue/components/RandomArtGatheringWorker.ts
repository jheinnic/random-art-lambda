import { Inject, Injectable, Logger } from "@nestjs/common"
import { WorkerHost } from "@nestjs/bullmq"
import { Canvas, CanvasRenderingContext2D, ImageData } from "canvas"
import { Job, Worker } from "bullmq"

import {
   Envelope,
   NominalUtil,
   PixelsData,
   ULIDString,
   type EnvelopeMemento,
   type PaintedData,
} from "../../../messages/index.js"
import {
   CURRENT_RELEASE,
   type GatherPaintedPartsRequest,
   type GatherPaintedPartsResult,
   type PartialPaintResult,
} from "../../messages/dto/index.js"
import { OutcomeType } from "../../messages/values/TaskResultRecord.js"
import { type IImageStager, type StagingContext } from "../../staging/index.js"
import { QueuedPaintingTypes } from "../di/Types.js"

const PROGRESS_FOR_STAGED_WRITE: number = 20
const PROGRESS_FOR_CHILD_DATA_MERGER: number = 100 - PROGRESS_FOR_STAGED_WRITE

// Local type aliases for cleaner signatures
type GatherRequestMemento = EnvelopeMemento<GatherPaintedPartsRequest<object>>
type ChildResultMemento = EnvelopeMemento<PartialPaintResult>
type GatherResultEnvelope = Envelope<GatherPaintedPartsResult>

/**
 * Worker that gathers painted parts and assembles them into a final image.
 *
 * NOTE: No static @Processor decorator - the queue name is applied dynamically
 * by the module configuration using Processor(queueName)(RandomArtGatheringWorker).
 * This allows queue names to come from configuration rather than being hardcoded.
 */
@Injectable()
export class RandomArtGatheringWorker extends WorkerHost<
   Worker<GatherRequestMemento, GatherResultEnvelope>
> {
   private readonly logger: Logger

   constructor(
      @Inject(QueuedPaintingTypes.InjectedImageStager)
      private readonly stager: IImageStager,
   ) {
      super()
      this.logger = new Logger("painting.queued.RandomArtGatheringWorker")
      this.logger.log("Created gathering worker")
   }

   async process(
      job: Job<GatherRequestMemento, GatherResultEnvelope>,
   ): Promise<GatherResultEnvelope> {
      this.logger.log(`Processing gather job: ${job.name}`)

      // Step 1: Restore envelope from wire format
      const requestEnvelope: Envelope<GatherPaintedPartsRequest> =
         Envelope.fromWire<GatherPaintedPartsRequest, never>(
            job.data,
            CURRENT_RELEASE,
         )

      if (!requestEnvelope.isMessage) {
         // Handle error or invalid envelope
         return this.createErrorResult(
            requestEnvelope,
            "Invalid or error envelope received",
         )
      }

      // Step 2: Use handleWith for proper lifecycle management
      return await requestEnvelope.handleWith<GatherPaintedPartsResult>(
         async (
            handling: Envelope<GatherPaintedPartsRequest>,
         ): Promise<GatherPaintedPartsResult> => {
            const request: GatherPaintedPartsRequest = handling.getPayload()
            const { taskId, expectedPartCount } = request
            const { width: pixelWidth, height: pixelHeight } =
               request.paintGeometry.imageSize
            const childData: Record<string, ChildResultMemento> =
               await job.getChildrenValues()
            const childKeys: string[] = Object.keys(childData)

            if (childKeys.length === 0) {
               throw new Error(`Task ${taskId}: No child results received`)
            }
            this.logger.log(
               `Task ${taskId}: Gathering ${expectedPartCount} parts for ${pixelWidth}x${pixelHeight} image`,
            )

            // Step 4: Allocate a Uint8ClampedArray to hold collected pixel data
            let progress: number = 0
            const progressPerChild: number =
               PROGRESS_FOR_CHILD_DATA_MERGER / childKeys.length
            const destArray: Uint8ClampedArray = new Uint8ClampedArray(
               pixelWidth * pixelHeight * 4,
            )
            for (const [childKey, childMemento] of Object.entries(childData)) {
               this.gatherChildPart(destArray, childMemento, childKey, taskId)
               progress += progressPerChild
               await job.updateProgress(Math.floor(progress))
            }

            // Step 6: Convert pixel data to PNG via canvas
            const canvas = new Canvas(pixelWidth, pixelHeight, "image")
            const ctx: CanvasRenderingContext2D = canvas.getContext("2d", {
               alpha: false,
               pixelFormat: "RGB24",
            })
            const fullImageData: ImageData = new ImageData(
               destArray,
               pixelWidth,
               pixelHeight,
            )
            ctx.putImageData(fullImageData, 0, 0)

            // Convert to PNG buffer
            const imageData: PaintedData = canvas.toBuffer(
               "image/png",
            ) as PaintedData

            // Step 7: Stage the image - worker doesn't know WHERE, just "Go"
            const stagingContext: StagingContext = {
               imageData,
               taskId,
               projectId: request.projectId,
               genSeed: request.paintTask.genSeed,
               width: pixelWidth,
               height: pixelHeight,
            }

            const result = await this.stager.stage(stagingContext)

            await job.updateProgress(100)
            this.logger.log(`Task ${taskId}: Image staged successfully`)

            return request.projectId != null
               ? {
                    taskId,
                    projectId: request.projectId,
                    result,
                    domainExtension: request.paintTask.domainExtension,
                    regionMapName: request.paintTask.plotDataRef.regionMapName,
                 }
               : {
                    taskId,
                    result,
                    domainExtension: request.paintTask.domainExtension,
                    regionMapName: request.paintTask.plotDataRef.regionMapName,
                 }
         },
      )
   }

   gatherChildPart(
      destArray: Uint8ClampedArray,
      childMemento: EnvelopeMemento<PartialPaintResult>,
      childKey: string,
      taskId: ULIDString,
   ): void {
      const childEnvelope: Envelope<PartialPaintResult> =
         Envelope.fromWire<PartialPaintResult>(childMemento, CURRENT_RELEASE)

      if (!childEnvelope.isMessage) {
         // TODO: Clarify behavior with missing/broken parts
         throw new Error(
            `Task ${taskId}: Skipping invalid child result ${childKey}`,
         )
      }

      const partResult: PartialPaintResult = childEnvelope.getPayload()
      const { canvasFragment, fragmentGeometry, pixelData } = partResult

      // Bless and convert pixel data for insertion into full image array
      const paintedData: PixelsData = NominalUtil.toPixelsData(
         pixelData,
         fragmentGeometry,
      )
      const firstRowOffset =
         canvasFragment.fragmentFirstRow * fragmentGeometry.width * 4
      destArray.set(paintedData, firstRowOffset)

      this.logger.debug(
         `Task ${taskId}: Merged fragment index ${canvasFragment.fragmentIndex}/${canvasFragment.totalFragmentsCount}, rows ${canvasFragment.fragmentFirstRow} to ${canvasFragment.fragmentLastRow}`,
      )
   }

   /**
    * Create an error result envelope when the request envelope is invalid.
    */
   private createErrorResult(
      requestEnvelope: Envelope<GatherPaintedPartsRequest<object>>,
      errorMessage: string,
   ): GatherResultEnvelope {
      this.logger.error(errorMessage)

      // For error cases, we still need to create a reply
      // Use beginHandling/endHandling manually since we can't use handleWith
      requestEnvelope.beginHandling()
      const replyEnvelope =
         requestEnvelope.startReplying<GatherPaintedPartsResult>()

      const errorResult: GatherPaintedPartsResult = {
         taskId: "" as any, // Unknown since envelope is invalid
         result: {
            outcomeType: OutcomeType.FATAL_ERROR,
            errorIfFailed: errorMessage,
         },
      }

      replyEnvelope.commitBody(errorResult)
      requestEnvelope.endHandling()

      return replyEnvelope
   }
}
