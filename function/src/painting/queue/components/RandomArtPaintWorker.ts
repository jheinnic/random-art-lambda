import { IpldRegionMapRepository } from "./../../../plotting/ipld/components/IpldRegionMapRepository"
import { Inject, Logger } from "@nestjs/common"
import { Processor, WorkerHost } from "@nestjs/bullmq"
import { Job } from "bullmq"

import { PaintingModuleTypes } from "./../../di/Types.js"
import { RandomArtTaskEngine } from "./../../components/RandomArtTaskEngine.js"
import { IpldModuleTypes } from "../../../ipld/index.js"
import { IpldPlottingModuleTypes } from "../../../plotting/ipld/di/Types.js"

@Processor("paintTasks")
export class RandomArtPaintWorker extends WorkerHost {
   private readonly logger: Logger

   constructor(
      @Inject(PaintingModuleTypes.IRandomArtTaskEngine)
      private readonly taskEngine: RandomArtTaskEngine,
      @Inject(IpldPlottingModuleTypes.IpldRegionMapRepository)
      private readonly regionMapRepo: IpldRegionMapRepository,
   ) {
      super()
      this.logger = new Logger("painting.queued.RandomArtPaintWorker")
      this.logger.log("Created paint worker")
   }

   async process(job: Job<any, any, string>): Promise<any> {
      this.logger.log("Working on " + JSON.stringify(job))
      let progress = 0
      for (let i = 0; i < 100; i++) {
         await this.doSomething(job.data)
         progress += 1
         await job.updateProgress(progress)
      }
      console.log("Finishing: " + JSON.stringify(job.data))
      return {}
   }

   async doSomething(data: object): Promise<void> {
      await new Promise((resolve, _reject) => {
         resolve(42)
      })
   }
}
