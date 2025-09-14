import { Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"

import { QueuedPaintingTypes } from "./Types.js"
import { RandomArtFlowProducer } from "./../components/RandomArtFlowProducer.js"
import { RandomArtPaintWorker } from "./../components/RandomArtPaintWorker.js"
import { RandomArtPaintEventListener } from "../components/RandomArtPaintEventListener.js"
import { RandomArtStoreWorker } from "../components/RandomArtStoreWorker.js"
import { RandomArtStoreEventListener } from "../components/RandomArtStoreEventListener.js"

@Module({
   imports: [
      BullModule.forRoot({
         connection: {
            host: "localhost",
            port: 6379,
         },
         defaultJobOptions: {
            keepLogs: 250,
            removeOnComplete: false,
            removeOnFail: false,
            sizeLimit: 1024 * 1024 * 1024,
         },
      }),
      BullModule.registerQueue(
         {
            name: "paintTasks",
         },
         {
            name: "paintResults",
         },
      ),
      BullModule.registerFlowProducer({
         name: "paintFlows",
      }),
   ],
   providers: [
      {
         provide: QueuedPaintingTypes.FlowProducer,
         useClass: RandomArtFlowProducer,
      },
      {
         provide: QueuedPaintingTypes.StoreWorker,
         useClass: RandomArtStoreWorker,
      },
      {
         provide: QueuedPaintingTypes.PaintWorker,
         useClass: RandomArtPaintWorker,
      },
      {
         provide: QueuedPaintingTypes.StoreListener,
         useClass: RandomArtStoreEventListener,
      },
      {
         provide: QueuedPaintingTypes.QueueListener,
         useClass: RandomArtPaintEventListener,
      },
   ],
   exports: [
      QueuedPaintingTypes.FlowProducer,
      QueuedPaintingTypes.PaintWorker,
      QueuedPaintingTypes.QueueListener,
   ],
})
export class QueueingPaintModule {}
