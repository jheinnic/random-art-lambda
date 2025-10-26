import { IpldRegionMapRepository } from "./../../../plotting/ipld/components/IpldRegionMapRepository.js"
import { Inject, Logger } from "@nestjs/common"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job, Worker } from "bullmq"

import { PaintingModuleTypes } from "./../../di/Types.js"
import { RandomArtTaskEngine } from "./../../components/RandomArtTaskEngine.js"
import { IpldModuleTypes } from "../../../ipld/index.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"
import { PlottingModuleTypes } from "../../../plotting/di/Types.js"

@Processor("paintTasks")
export class RandomArtPaintWorker extends WorkerHost<
   Worker<
      { item: string },
      {
         inputData: string
         id: string
         from: string
         token: string
         name: "Bob"
      }
   >
> {
   private readonly logger: Logger

   constructor(
      @Inject(PaintingModuleTypes.IRandomArtTaskEngine)
      private readonly taskEngine: RandomArtTaskEngine,
      @Inject(PlottingModuleTypes.IRegionMapRepository)
      private readonly regionMapRepo: IpldRegionMapRepository,
   ) {
      super()
      this.logger = new Logger("painting.queued.RandomArtPaintWorker")
      this.logger.log("Created paint worker")
   }

   get worker(): Worker<
      { item: string },
      {
         inputData: string
         id: string
         from: string
         token: string
         name: "Bob"
      }
   > {
      return super.worker
   }

   async process(
      job: Job<
         { item: string },
         {
            inputData: string
            id: string
            from: string
            token: string
            name: "Bob"
         },
         "Bob"
      >,
   ): Promise<any> {
      this.logger.log("Working on " + JSON.stringify(job))
      let progress = 0
      for (let i = 0; i < 100; i++) {
         await this.doSomething(job.data)
         progress += 1
         await job.updateProgress(progress)
         if (progress % 20 === 0) {
            this.logger.log(
               "Progress on " +
                  JSON.stringify(job.data) +
                  " is at " +
                  progress.toString(10) +
                  "%",
            )
         }
      }
      return {
         inputData: JSON.stringify(job.data),
         id: job.id,
         from: job.queueQualifiedName,
         token: job.token,
         name: job.name,
      }
   }

   async doSomething(data: object): Promise<void> {
      await new Promise((resolve, _reject) => {
         resolve(42)
      })
   }
}
