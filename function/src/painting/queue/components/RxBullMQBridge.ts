import { Injectable, OnModuleInit, Inject } from "@nestjs/common"
import { Queue } from "bullmq"
import { Subject, mergeMap, from, tap, Observable } from "rxjs"
import { RxChannel } from "../../../channels/components/RxChannel.js"
import { RandomArtTaskCall } from "../../message/RandomArtTaskCall.js"

@Injectable()
export class RxBullMQBridge implements OnModuleInit {
   private readonly queue: Queue
   private readonly taskInput$ = new Subject<PaintTask>()
   private readonly taskOutput$ = new Subject<PaintResult>()

   constructor(
      @Inject("TASK_CHANNEL")
      private readonly taskChannel: RxChannel<RandomArtTaskCall>,
   ) {
      this.queue = new Queue("paint-jobs", {
         connection: { host: "localhost", port: 6379 },
      })
   }

   async onModuleInit() {
      // Bridge RxChannel to BullMQ
      this.taskChannel
         .asObservable()
         .pipe(
            // Add to BullMQ queue
            mergeMap(
               (task) => from(this.queue.add("paint", task)),
               8, // Process up to 8 concurrent additions
            ),
            tap((job) => console.log(`Queued job ${job.id}`)),
         )
         .subscribe()

      // Create workers that publish results back
      const worker = new Worker("paint-jobs", async (job) => {
         const result = await this.processPaintJob(job.data)
         this.taskOutput$.next(result)
         return result
      })
   }

   getResults(): Observable<PaintResult> {
      return this.taskOutput$.asObservable()
   }
}
