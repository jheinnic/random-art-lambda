export interface ModuleConfigData {
   redis: {
      host: string
      port: number
   }
   retention: {
      keepLogs: number
      removeOnComplete: {
         age: number
      }
      removeOnFail: {
         age: number
      }
   }
   jobDataSizeLimit: number
   flowProducerNames: {
      forJobSpecs: string
   }
   /**
    * Queue names - aligned with paintQueueNames.yaml schema
    */
   queueNames: {
      /** Queue for scatter/paint tasks */
      toPaintParts: string
      /** Queue for gather/assemble tasks */
      toGatherParts: string
      /** Queue for project-level gather tasks */
      toGatherTasks: string
      /** Queue for receiving replies (per-node, dynamically named) */
      toReceiveReplies: string
   }
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
   roles: Array<"paintWorker" | "mainApp" | "stageWorker" | "jobDoneWorker">
}
