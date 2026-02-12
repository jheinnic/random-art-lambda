import { JobDisposition } from "../types/JobDisposition.js"

/**
 * Error thrown when collection fails before handler invocation.
 *
 * This occurs when a child job has a disposition that is configured
 * with FAIL handling strategy (either ignoreHandling or errorHandling).
 *
 * The collection handler is never called in this case.
 */
export class CollectionPreInvocationFailureError extends Error {
   constructor(
      message: string,
      public readonly context: {
         disposition: JobDisposition
         childIndex: number
         jobId: string
         error?: Error
      },
   ) {
      super(message)
      this.name = "CollectionPreInvocationFailureError"
      Error.captureStackTrace(this, CollectionPreInvocationFailureError)
   }
}
