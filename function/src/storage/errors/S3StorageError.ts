import { FatalStorageError, TransientStorageError } from "./StorageError.js"

/**
 * S3-specific storage errors with built-in classification.
 */

/**
 * S3 API contract violation - invalid bucket name or key per S3 specification.
 *
 * This is a FATAL error (non-retryable) because the input violates S3's rules
 * and won't magically become valid on retry.
 *
 * This is NOT a semantic error - it violates AWS's rules, not yours.
 */
export class S3InvalidInputError extends FatalStorageError {
   constructor(
      message: string,
      public readonly bucket?: string,
      public readonly key?: string,
      cause?: Error,
   ) {
      super(message, cause)
   }
}

/**
 * S3 bucket does not exist.
 *
 * This is a FATAL error because it indicates a configuration problem.
 */
export class S3BucketNotFoundError extends FatalStorageError {
   constructor(
      public readonly bucket: string,
      cause?: Error,
   ) {
      super(`S3 bucket not found: ${bucket}`, cause)
   }
}

/**
 * S3 access denied - insufficient permissions.
 *
 * This is a FATAL error because permissions won't change on retry.
 */
export class S3PermissionError extends FatalStorageError {
   constructor(
      message: string,
      public readonly bucket?: string,
      public readonly key?: string,
      cause?: Error,
   ) {
      super(message, cause)
   }
}

/**
 * S3 network or timeout error.
 *
 * This is a TRANSIENT error - may self-correct on retry.
 */
export class S3NetworkError extends TransientStorageError {
   constructor(
      message: string,
      cause?: Error,
   ) {
      super(message, cause)
   }
}

/**
 * Classify an S3 error into the appropriate typed error.
 *
 * This encapsulates all the error inspection logic that was previously
 * in the middleware's `classifyS3Error()` method.
 *
 * @param error - Raw error from S3 SDK or FileStore
 * @param bucket - Optional bucket name for context
 * @param key - Optional key for context
 * @returns Typed StorageError with classification built-in
 */
export function classifyS3Error(
   error: Error,
   bucket?: string,
   key?: string,
): FatalStorageError | TransientStorageError {
   const errorMessage = error.message.toLowerCase()
   const errorName = error.name

   // AWS API contract violations (malformed input per S3 spec)
   if (
      errorMessage.includes("invalid bucket name") ||
      errorMessage.includes("invalid key")
   ) {
      return new S3InvalidInputError(error.message, bucket, key, error)
   }

   // Bucket not found
   if (errorName === "NoSuchBucket" || errorMessage.includes("does not exist")) {
      return new S3BucketNotFoundError(bucket ?? "unknown", error)
   }

   // Permission errors
   if (
      errorName === "AccessDenied" ||
      errorMessage.includes("access denied") ||
      errorMessage.includes("permission")
   ) {
      return new S3PermissionError(error.message, bucket, key, error)
   }

   // Network/timeout errors (transient)
   if (
      errorMessage.includes("timeout") ||
      errorMessage.includes("network") ||
      errorMessage.includes("connection") ||
      errorName === "RequestTimeout"
   ) {
      return new S3NetworkError(error.message, error)
   }

   // Unknown errors default to transient (safe default for retrying)
   return new S3NetworkError(`Unknown S3 error: ${error.message}`, error)
}
