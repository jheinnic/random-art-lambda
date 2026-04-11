/**
 * Job disposition states for middleware chain execution.
 *
 * The first middleware to set a non-OK disposition terminates the chain.
 */
export enum JobDisposition {
   /**
    * Happy path - processing successful
    */
   OK = "OK",

   /**
    * Business rule exclusion - soft error indicating content should not be retained
    */
   IGNORE = "IGNORE",

   /**
    * Retryable technical failure - might self-correct on retry
    */
   TRANSIENT_ERROR = "TRANSIENT_ERROR",

   /**
    * Non-retryable technical failure - requires intervention
    */
   FATAL_ERROR = "FATAL_ERROR",

   /**
    * Business rule violation - input violates application-specific domain constraints.
    *
    * Use this ONLY when input violates YOUR application's semantic rules, not external
    * API contracts. Examples:
    * - Image dimensions are valid but violate "must be square" business rule
    * - S3 key is valid per S3 spec but violates "must start with color name" rule
    * - Region map name is valid string but not in application's allowlist
    *
    * Do NOT use for:
    * - AWS S3 API validation errors (invalid bucket/key per S3 spec) → FATAL_ERROR
    * - Filesystem API errors (EINVAL, invalid path per OS) → FATAL_ERROR
    * - Missing middleware chain dependencies → FATAL_ERROR
    * - Expression syntax errors → FATAL_ERROR
    */
   SEMANTIC_ERROR = "SEMANTIC_ERROR",

   /**
    * Exhausted retry attempts - transient error that didn't resolve
    */
   OUT_OF_RETRIES = "OUT_OF_RETRIES",
}

/**
 * Hard error dispositions that indicate permanent failure
 */
export type HardErrorDisposition =
   | JobDisposition.FATAL_ERROR
   | JobDisposition.SEMANTIC_ERROR
   | JobDisposition.OUT_OF_RETRIES

export type KnownResolutionDisposition =
   | JobDisposition.OK
   | JobDisposition.IGNORE

export type TerminalDisposition =
   | HardErrorDisposition
   | KnownResolutionDisposition

export type ErrorCaseDisposition =
   | HardErrorDisposition
   | JobDisposition.TRANSIENT_ERROR

/**
 * Soft error disposition for business rule exclusions
 */
export type SoftErrorDisposition = JobDisposition.IGNORE

export type MiddlewareThrowable =
   | JobDisposition.FATAL_ERROR
   | JobDisposition.SEMANTIC_ERROR
   | JobDisposition.TRANSIENT_ERROR

export type MiddlewareReturnable =
   | KnownResolutionDisposition
   | MiddlewareThrowable

/**
 * Check if disposition is a hard error
 */
export function isHardError(
   disposition: JobDisposition,
): disposition is HardErrorDisposition {
   return (
      disposition === JobDisposition.FATAL_ERROR ||
      disposition === JobDisposition.SEMANTIC_ERROR ||
      disposition === JobDisposition.OUT_OF_RETRIES
   )
}

export function isKnownResolution(
   disposition: JobDisposition,
): disposition is KnownResolutionDisposition {
   return (
      disposition === JobDisposition.OK || disposition === JobDisposition.IGNORE
   )
}

export function isErrorCase(
   disposition: JobDisposition,
): disposition is ErrorCaseDisposition {
   return (
      isHardError(disposition) || disposition === JobDisposition.TRANSIENT_ERROR
   )
}

export function isTerminal(
   disposition: JobDisposition,
): disposition is HardErrorDisposition {
   return isKnownResolution(disposition) || isHardError(disposition)
}

/**
 * Check if disposition is retryable
 */
export function isRetryable(
   disposition: JobDisposition,
): disposition is JobDisposition.TRANSIENT_ERROR {
   return disposition === JobDisposition.TRANSIENT_ERROR
}

export function isMiddlewareThrowable(
   disposition: JobDisposition,
): disposition is MiddlewareReturnable {
   return (
      disposition === JobDisposition.FATAL_ERROR ||
      disposition === JobDisposition.TRANSIENT_ERROR ||
      disposition === JobDisposition.SEMANTIC_ERROR
   )
}

export function isMiddlewareReturnable(
   disposition: JobDisposition,
): disposition is MiddlewareReturnable {
   return isKnownResolution(disposition) || isMiddlewareThrowable(disposition)
}
