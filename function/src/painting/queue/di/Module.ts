import { DynamicModule, Module } from "@nestjs/common"
import { BullModule, Processor } from "@nestjs/bullmq"

import { QueuedPaintingTypes } from "./Types.js"
import { RandomArtFlowProducer } from "./../components/RandomArtFlowProducer.js"
import { RandomArtPaintingWorker } from "../components/RandomArtPaintingWorker.js"
import { RandomArtStoreWorker } from "../components/RandomArtStoreWorker.js"
import { RandomArtStoreEventListener } from "../components/RandomArtStoreEventListener.js"

import {
   DefaultDirector,
   IDynamicModuleBuilder,
   InjectableModuleClassFactory,
} from "../../../modules/index.js"
import { ReturnQueueRoutingProcessor as ReplyQueueRoutingProcessor } from "../components/ReturnQueueRoutingProcessor.js"
import { ModuleConfigData } from "./Configuration.js"
import { RandomArtGatheringWorker } from "../components/RandomArtGatheringWorker.js"
import { FlowConfiguration } from "../components/FlowConfiguration.js"

const injectModuleTokens = {
   paintEngine: QueuedPaintingTypes.InjectedPaintEngine,
   regionMapRepo: QueuedPaintingTypes.InjectedRegionMapRepo,
   imageStager: QueuedPaintingTypes.InjectedImageStager,
}

const moduleHost = InjectableModuleClassFactory.create(
   injectModuleTokens,
   (config: ModuleConfigData): DefaultDirector => {
      return (builder: IDynamicModuleBuilder): void => {
         builder.importModules(
            BullModule.forRoot({
               connection: config.redis,
               defaultJobOptions: {
                  sizeLimit: config.jobDataSizeLimit,
                  ...config.retention,
               },
            }),
            BullModule.registerQueue(
               ...Object.entries(config.queueNames).map(
                  (value: [string, string]): { name: string } => {
                     return { name: value[1] }
                  },
               ),
            ),
            BullModule.registerFlowProducer(
               ...Object.entries(config.flowProducerNames).map(
                  (value: [string, string]): { name: string } => {
                     return { name: value[1] }
                  },
               ),
            ),
         )
         builder.exportProviders({
            provide: QueuedPaintingTypes.ReplyQueueRoutingProcessor,
            useClass: ReplyQueueRoutingProcessor,
         })
         if (config.roles.includes("mainApp")) {
            builder.exportProviders(
               {
                  provide: QueuedPaintingTypes.FlowProducer,
                  useClass: RandomArtFlowProducer,
               },
               {
                  provide: QueuedPaintingTypes.FlowProducerConfig,
                  useValue: new FlowConfiguration(
                     config.queueNames.toPaintParts,
                     56000,
                     config.queueNames.toGatherParts,
                     config.queueNames.toGatherTasks,
                  ),
               },
            )
         }
         if (config.roles.includes("paintWorker")) {
            // Apply @Processor decorator dynamically with configured queue name
            // Concurrency controls how many paint jobs run in parallel per worker process
            const paintConcurrency = config.workerConcurrency?.paint ?? 1
            Processor(config.queueNames.toPaintParts, {
               concurrency: paintConcurrency,
            })(RandomArtPaintingWorker)
            builder.exportProviders({
               provide: QueuedPaintingTypes.PaintWorker,
               useClass: RandomArtPaintingWorker,
            })
         }
         if (config.roles.includes("stageWorker")) {
            // Apply @Processor decorator dynamically with configured queue name
            const gatherConcurrency = config.workerConcurrency?.gather ?? 1
            Processor(config.queueNames.toGatherParts, {
               concurrency: gatherConcurrency,
            })(RandomArtGatheringWorker)
            // RandomArtGatheringWorker uses QueuedPaintingTypes.InjectedImageStager,
            // which is wired via injectModuleTokens from the external config
            builder.defineProviders({
               provide: QueuedPaintingTypes.StagingWorker,
               useClass: RandomArtGatheringWorker,
            })
         } else if ("jobCompleteWorker" in config.roles) {
            builder.defineProviders(
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
