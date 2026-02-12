import { Worker, Job } from "bullmq"

const paintWorker = new Worker(
   "partialPainting",
   async (job: Job<Envelope<PartialPaintRequest>>) => {
      const envelope = job.data

      // The entire worker lifecycle is now traced
      const responseEnvelope = await TraceProcessor.execute(
         envelope,
         async (request) => {
            // Accessing current IDs for domain logging
            const { jobId } = TraceProcessor.current()!
            console.log(
               `[${jobId}] Painting slice ${request.partialSlice.partIndex}...`,
            )

            // Call your existing RandomArt engine
            return await renderPartialSlice(request)
         },
      )

      // Send back to HQ via another queue or reply channel
      await resultsQueue.add("complete", responseEnvelope)
   },
)
