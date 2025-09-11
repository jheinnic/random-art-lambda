import { Injectable, Logger } from "@nestjs/common"
import { InjectFlowProducer } from "@nestjs/bullmq"
import { FlowProducer } from "bullmq"

@Injectable()
export class RandomArtFlowProducer {
   private readonly logger: Logger
   constructor(
      @InjectFlowProducer("paintFlows")
      private readonly flowProducer: FlowProducer,
   ) {
      this.logger = new Logger("painting.queued.RandomArtFlowProducer")
      this.logger.log("FlowProducerCreated")
   }

   public async doIt(): Promise<void> {
      const job = await this.flowProducer.add({
         name: "save",
         queueName: "paintResults",
         data: { filePath: "rdoc02/sample.png" },
         children: [
            {
               name: "playTask",
               data: {
                  phrase: {
                     style: "binary",
                     prefix: "4e10af4880f99646cb5020fb6a8a5872",
                     suffix: "38df27bbfa41de7c51f0d2754b1f8c12",
                  },
                  regionMap: {
                     cid: "bafyreiexe6npphnaou2tz7jdbwtgh2wnfdbsnbti22smksport4sqr7bgu",
                     firstRow: 0,
                     lastRow: 1023,
                  },
               },
               queueName: "paintTasks",
            },
         ],
      })
      this.logger.log(job)
   }
}
