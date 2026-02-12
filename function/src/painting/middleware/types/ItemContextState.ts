import { JobDisposition } from "./JobDisposition.js"

/**
 * Mutable state for item-level middleware processing.
 *
 * Middleware handlers receive readonly input + current state,
 * and return updated state (typically via object spread).
 */
export interface ItemContextState {
   /**
    * Current job disposition.
    * Starts as OK, middleware may change to indicate completion status.
    */
   disposition: JobDisposition

   /**
    * Error that caused non-OK disposition (if any)
    */
   error?: Error

   /**
    * Encoded PNG buffer (derived from pixels).
    * Typically set before middleware chain begins, but can be regenerated.
    */
   buffer: Buffer

   /**
    * Resolved filename for storage.
    * Set by caller, FileNameResolverMiddleware, or ContentHashFileNamerMiddleware.
    */
   actualFilename?: string

   /**
    * Custom data for expression evaluation and application use.
    * Middleware can store arbitrary data here for downstream handlers.
    * Collection-level middleware receives this from each child job.
    */
   customData?: Record<string, any>

   /**
    * Retry tracking (managed by framework, not middleware)
    */
   retry?: {
      /**
       * Current attempt number (1-based)
       * First attempt = 1, first retry = 2, etc.
       */
      attemptNumber: number

      /**
       * Index of last middleware that completed successfully.
       * Used to resume chain on retry instead of restarting from beginning.
       * undefined = start from beginning
       */
      lastCompletedMiddlewareIndex?: number

      /**
       * Maximum number of attempts allowed
       */
      maxAttempts: number
   }
}
