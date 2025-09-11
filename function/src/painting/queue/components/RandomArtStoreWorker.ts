import { Logger } from "@nestjs/common"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"

@Processor("paintResults")
export class RandomArtStoreWorker extends WorkerHost {
   private readonly logger: Logger

   constructor() {
      super()
      this.logger = new Logger("painting.queued.RandomArtStoreWorker")
      this.logger.log("Created store worker")
   }

   async process(job: Job<any, any, string>): Promise<any> {
      this.logger.log("Working on " + JSON.stringify(job))
      let progress = 0
      for (let i = 0; i < 100; i++) {
         await this.doSomething(job.data)
         progress += 1
         await job.updateProgress(progress)
      }
      return {}
   }

   async doSomething(data: object): Promise<void> {
      await new Promise((resolve, _reject) => {
         resolve(42)
      })
      console.log("Finishing: " + JSON.stringify(data))
   }
}
