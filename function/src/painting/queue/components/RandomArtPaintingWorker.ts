import { Inject, Injectable, Logger } from "@nestjs/common"
import { WorkerHost } from "@nestjs/bullmq"
import { Job, Worker } from "bullmq"

import { Envelope, type EnvelopeMemento } from "../../../messages/index.js"
import {
   CURRENT_RELEASE,
   type PartialPaintRequest,
   type PartialPaintResult,
} from "../../messages/dto/index.js"
import { PaintingModuleTypes } from "../../artwork/di/Types.js"
import { RandomArtTaskEngine } from "../../artwork/components/RandomArtTaskEngine.js"

// Local type aliases for cleaner signatures
type PaintRequestMemento = EnvelopeMemento<PartialPaintRequest>
type PaintResultEnvelope = Envelope<PartialPaintResult>

/**
 * Worker that processes painting tasks from the queue.
 *
 * NOTE: No static @Processor decorator - the queue name is applied dynamically
 * by the module configuration using Processor(queueName)(RandomArtPaintingWorker).
 * This allows queue names to come from configuration rather than being hardcoded.
 */
@Injectable()
export class RandomArtPaintingWorker extends WorkerHost<
   Worker<PaintRequestMemento, PaintResultEnvelope>
> {
   private readonly logger: Logger

   constructor(
      @Inject(PaintingModuleTypes.IRandomArtTaskEngine)
      private readonly taskEngine: RandomArtTaskEngine,
   ) {
      super()
      this.logger = new Logger("painting.queued.RandomArtPaintWorker")
      this.logger.log("Created paint worker")
   }

   async process(
      job: Job<PaintRequestMemento, PaintResultEnvelope>,
   ): Promise<PaintResultEnvelope> {
      this.logger.log(`Processing paint job: ${job.name}`)

      // Step 1: Restore envelope from wire format
      const requestEnvelope = Envelope.fromWire<PartialPaintRequest, never>(
         job.data,
         CURRENT_RELEASE,
      )

      if (!requestEnvelope.isMessage) {
         throw new Error("Invalid or error envelope received")
      }

      // Step 2: Use handleWith for proper lifecycle management
      return await requestEnvelope.handleWith<PartialPaintResult>(
         async (handling) => {
            const request = handling.getPayload()

            this.logger.log(
               `Task ${request.taskId}: Painting fragment ${request.canvasFragment.fragmentIndex}/${request.canvasFragment.totalFragmentsCount}`,
            )

            // Step 3: Delegate actual painting to the task engine
            const result = await this.taskEngine.performPaintTask(
               request,
               this.logger,
            )

            await job.updateProgress(100)
            this.logger.log(
               `Task ${request.taskId}: Fragment ${request.canvasFragment.fragmentIndex} complete`,
            )

            return result
         },
      )
   }
}
