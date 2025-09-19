import { DynamicModule, Module } from "@nestjs/common"
import { BullModule } from "@nestjs/bullmq"

import { QueuedPaintingTypes } from "./Types.js"
import { RandomArtFlowProducer } from "./../components/RandomArtFlowProducer.js"
import { RandomArtPaintWorker } from "./../components/RandomArtPaintWorker.js"
import { RandomArtPaintEventListener } from "../components/RandomArtPaintEventListener.js"
import { RandomArtStoreWorker } from "../components/RandomArtStoreWorker.js"
import { RandomArtStoreEventListener } from "../components/RandomArtStoreEventListener.js"

import {
   DefaultDirector,
   IDynamicModuleBuilder,
   InjectableModuleClassFactory,
} from "../../../modules/index.js"

const injectModuleTokens = {
   paintEngine: QueuedPaintingTypes.InjectedPaintEngine,
   regionMapRepo: QueuedPaintingTypes.InjectedRegionMapRepo,
   randomArtTaskCallChannel:
      QueuedPaintingTypes.InjectedRandomArtTaskCallChannel,
   randomArtTaskReplyChannel:
      QueuedPaintingTypes.InjectedRandomArtTaskReplyChannel,
}

interface ModuleConfigData {
   redis: {
      host: string
      port: number
   }
   logRetention: {
      keepLogs: number
      removeOnComplete: boolean
      removeOnFail: boolean
   }
   jobDataSizeLimit: number
   queueNames: {
      toFlow: string
      toPaint: string
      toStore: string
      toReturn: string
   }
}

const moduleHost = InjectableModuleClassFactory.create(
   injectModuleTokens,
   (config: ModuleConfigData): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder
            .importModules(
               BullModule.forRoot({
                  connection: config.redis,
                  defaultJobOptions: {
                     ...config.logRetention,
                     sizeLimit: config.jobDataSizeLimit,
                     // keepLogs: 250,
                     // removeOnComplete: false,
                     // removeOnFail: false,
                     // sizeLimit: 1024 * 1024 * 1024,
                  },
               }),
               BullModule.registerQueue(
                  {
                     name: config.queueNames.toPaint,
                  },
                  {
                     name: config.queueNames.toReturn,
                  },
               ),
               BullModule.registerFlowProducer({
                  name: config.queueNames.toFlow,
               }),
            )
            .exportProviders(
               {
                  provide: QueuedPaintingTypes.PaintWorker,
                  useClass: RandomArtPaintWorker,
               },
               {
                  provide: QueuedPaintingTypes.PaintListener,
                  useClass: RandomArtPaintEventListener,
               },
               {
                  provide: QueuedPaintingTypes.FlowProducer,
                  useClass: RandomArtFlowProducer,
               },
            )
            .defineProviders(
               {
                  provide: QueuedPaintingTypes.StoreWorker,
                  useClass: RandomArtStoreWorker,
               },
               {
                  provide: QueuedPaintingTypes.StoreListener,
                  useClass: RandomArtStoreEventListener,
               },
            )
      }
   },
)

export type QueuedPaintModuleConfiguration = typeof moduleHost.externalConfig

@Module({})
export class QueueingPaintModule extends moduleHost.build() {
   static forRoot(config: QueuedPaintModuleConfiguration): DynamicModule {
      return super.forRoot(config)
   }
}
