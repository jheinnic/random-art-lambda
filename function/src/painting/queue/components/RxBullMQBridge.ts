import { Injectable, OnModuleInit, Inject } from "@nestjs/common"
import { Subject, mergeMap, from, tap, Observable } from "rxjs"
import { Queue } from "bullmq"

import { RxChannel } from "../../../channels/components/RxChannel.js"
import { RandomArtTaskCall, RandomArtTaskReply } from "../../message/index.js"

@Injectable()
export class RxBullMQBridge implements OnModuleInit {
   private readonly queue: Queue
   private readonly taskInput$ = new Subject<RandomArtTaskCall>()
   private readonly taskOutput$ = new Subject<RandomArtTaskReply>()

   constructor(
      @Inject("TASK_CHANNEL")
      private readonly taskChannel: RxChannel<RandomArtTaskCall>,
   ) {
      this.queue = new Queue("paint-jobs", {
         connection: { host: "localhost", port: 6379 },
      })
   }

   async onModuleInit(): Promise<void> {
      // Bridge RxChannel to BullMQ
      this.taskChannel
         .asObservable()
         .pipe(
            // Add to BullMQ queue
            mergeMap(
               (task) => from(this.queue.add("paint", task)),
               8, // Process up to 8 concurrent additions
            ),
            tap((job) => console.log(`Queued job ${job.id ?? "undefined"}`)),
         )
         .subscribe()

      // Create workers that publish results back
      const worker = new Worker("paint-jobs", {})
   }

   // async processIt(job) => {
   //       const result: RandomArtTaskReply = this.processPaintJob(job.data)
   //       this.taskOutput$.next(result)
   //       return result
   //    }
   // }
   processPaintJob(data: any): RandomArtTaskReply {
      throw new Error("Method not implemented.")
   }

   getResults(): Observable<RandomArtTaskReply> {
      return this.taskOutput$.asObservable()
   }
}
