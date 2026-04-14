import {
   paintQueueRedis,
   PaintQueueRedisEnvironment,
   PaintQueueRetentionEnvironment,
} from "./../../../app/shared/di/Loaders"
import { PaintQueueNamesEnvironment } from "../../../app/shared/di/Loaders.js"
import type { ModuleDependenciesOption } from "../../../modules/index.js"

export interface ModuleConfigData {
   redis: PaintQueueRedisEnvironment
   retention: PaintQueueRetentionEnvironment
   flowProducerNames: PaintQueueNamesEnvironment["flowProducerNames"]
   /**
    * Queue names - aligned with paintQueueNames.yaml schema
    */
   queueNames: PaintQueueNamesEnvironment["queueNames"]
   /**
    * Worker concurrency settings.
    * Controls how many jobs each worker type processes simultaneously.
    * Default is 1 if not specified.
    */
   workerConcurrency?: {
      /** Concurrency for paint workers (CPU-intensive) */
      paint?: number
      /** Concurrency for gather/staging workers */
      gather?: number
   }
   roles: Array<
      "mainApp" | "paintWorker" | "stageWorker"
      // | "projectGatherer"
      // | "jobDoneWorker"
   >

   /**
    * File store dependency for the project gathering worker.
    * Required when the "projectGatherer" role is active.
    * Uses the same ModuleDependenciesOption format as injectModuleTokens.
    * Set to undefined when no projectGatherer role is configured.
    */
   fileStore: ModuleDependenciesOption | undefined
}
