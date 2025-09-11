import {
   QueueEventsListener,
   QueueEventsHost,
   OnQueueEvent,
} from "@nestjs/bullmq"
import { Logger } from "@nestjs/common"

@QueueEventsListener("paintTasks")
export class RandomArtQueueListener extends QueueEventsHost {
   private readonly logger: Logger

   constructor() {
      super()
      this.logger = new Logger("painting.queue.RandomArtQueueListener")
      this.logger.log("Here for paint events")
   }

   @OnQueueEvent("completed")
   onCompleted(jobData: {
      jobId: string
      returnvalue: string
      prev?: string
   }): void {
      this.logger.log(jobData)
   }
}
