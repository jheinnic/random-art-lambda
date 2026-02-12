/**
 * Base class for all storage-related errors.
 *
 * Encapsulates error classification logic so consumers don't need to
 * inspect error messages or codes - they just call `error.isRetryable()`.
 */
export abstract class StorageError extends Error {
   /**
    * Whether this error might self-correct on retry.
    *
    * Examples:
    * - Retryable: Network timeout, too many open files, resource busy
    * - Non-retryable: Invalid path, permission denied, disk full
    */
   abstract isRetryable(): boolean

   /**
    * Whether this error represents an external API contract violation
    * (as opposed to an application business rule violation).
    *
    * Used to distinguish FATAL_ERROR from SEMANTIC_ERROR in middleware.
    */
   isApiContractViolation(): boolean {
      // By default, storage errors are API violations (filesystem/S3 rules)
      // Subclasses can override if they represent semantic violations
      return true
   }

   constructor(
      message: string,
      public readonly cause?: Error,
   ) {
      super(message)
      this.name = this.constructor.name
      if (cause) {
         this.stack = `${this.stack}\nCaused by: ${cause.stack}`
      }
   }
}

/**
 * Transient storage error - likely to self-correct on retry.
 */
export class TransientStorageError extends StorageError {
   isRetryable(): boolean {
      return true
   }
}

/**
 * Fatal storage error - requires intervention, will not self-correct.
 */
export class FatalStorageError extends StorageError {
   isRetryable(): boolean {
      return false
   }
}
