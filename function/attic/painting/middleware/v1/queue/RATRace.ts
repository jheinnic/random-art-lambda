import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"
import { Envelope } from "../../../messages/components/Envelope.js"
import {
   PartialPaintRequest,
   PartialPaintResult,
} from "../../messages/index.js"

@Processor("paintResults")
export class RandomArtStoreWorker extends WorkerHost {
   constructor(private readonly engine: RandomArtEngine) {
      super()
   }

   /**
    * NestJS calls this when a job arrives.
    * TIn is Envelope<PartialPaintRequest>
    */
   async process(
      job: Job<Envelope<PartialPaintRequest>>,
   ): Promise<Envelope<PartialPaintResult>> {
      const envelope = job.data

      // 1. Enter the Execution Span
      return await TraceContext.run(envelope, async (payload) => {
         // 2. Perform the Domain Work (The "Math")
         // The Engine can now access TraceContext.current() for logging
         const pixels = await this.engine.render(
            payload.paintableSeed,
            payload.spatialRegion,
            payload.partialSlice,
         )

         // 3. Return the DTO fragment (The "Body")
         return {
            workloadId: envelope.workloadId,
            partIndex: payload.partialSlice.partIndex,
            pixelData: pixels,
         }
      })
   }
}
