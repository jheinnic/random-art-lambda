import {
   QueueEventsListener,
   QueueEventsHost,
   OnQueueEvent,
} from "@nestjs/bullmq"
import { Logger } from "@nestjs/common"

@QueueEventsListener("paintResults")
export class RandomArtStoreEventListener extends QueueEventsHost {
   private readonly logger: Logger

   constructor() {
      super()
      this.logger = new Logger("painting.queue.RandomArtStoreEventListener")
      this.logger.log("Here for Store Events")
   }

   @OnQueueEvent("completed")
   onCompleted(jobData: {
      jobId: string
      returnValue: string
      prev?: string
   }): void {
      this.logger.log(jobData)
   }
}
