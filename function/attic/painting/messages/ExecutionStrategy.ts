import {
   ASYNC_QUEUE_EXECUTION_STRATEGY,
   ASYNC_QUEUE_EXECUTION_STRATEGY_STR,
   IN_PLACE_EXECUTION_STRATEGY,
   IN_PLACE_EXECUTION_STRATEGY_STR,
   SYNC_QUEUE_EXECUTION_STRATEGY,
   SYNC_QUEUE_EXECUTION_STRATEGY_STR,
} from "./Constants.js"

export interface ExecutionStrategy {
   readonly executeBy: string
}

export interface SyncQueueExecutionStrategy extends ExecutionStrategy {
   readonly executeBy: SYNC_QUEUE_EXECUTION_STRATEGY
   readonly chunkPixels: number
   readonly paintQueue: string
   readonly timeoutAfter: number
}

export interface AsyncQueueExecutionStrategy extends ExecutionStrategy {
   readonly executeBy: ASYNC_QUEUE_EXECUTION_STRATEGY
   readonly chunkPixels: number
   readonly paintQueue: string
   readonly gatherQueue: string
   readonly timeoutAfter: number
}

export interface InPlaceExecutionStrategy extends ExecutionStrategy {
   readonly executeBy: IN_PLACE_EXECUTION_STRATEGY
   readonly timeoutAfter: number
}

export type KnownExecutionStrategy =
   | InPlaceExecutionStrategy
   | AsyncQueueExecutionStrategy
   | SyncQueueExecutionStrategy

export function isAsyncQueueStrategy(
   input: KnownExecutionStrategy,
): input is AsyncQueueExecutionStrategy {
   return input.executeBy === ASYNC_QUEUE_EXECUTION_STRATEGY_STR
}

export function isSyncQueueStrategy(
   input: KnownExecutionStrategy,
): input is AsyncQueueExecutionStrategy {
   return input.executeBy === SYNC_QUEUE_EXECUTION_STRATEGY_STR
}

export function isInPlaceExecStrategy(
   input: KnownExecutionStrategy,
): input is InPlaceExecutionStrategy {
   return input.executeBy === IN_PLACE_EXECUTION_STRATEGY_STR
}
