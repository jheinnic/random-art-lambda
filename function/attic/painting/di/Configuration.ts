export interface StreamedDelivery {
   readonly deliveryType: "streamed"
}

export interface PersistedDelivery {
   readonly deliveryType: "persisted"
   readonly parallelism: ParallelConfig
}

export interface SingleThreading {
   readonly threadingType: "single"
}

export interface TaskThreads {
   readonly threadingType: "tasks"
}

export interface ChunkThreads {
   readonly threadingType: "chunks"
}

export interface FullyParallel {
   readonly threadingType: "both"
}

export type ParallelConfig =
   | SingleThreading
   | TaskThreads
   | ChunkThreads
   | FullyParallel

export interface SinglePaintTaskConfiguration {}
