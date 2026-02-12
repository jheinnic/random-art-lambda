import { FatalStorageError, TransientStorageError } from "./StorageError.js"

/**
 * Filesystem-specific storage errors with built-in classification.
 */

/**
 * Filesystem API contract violation - invalid path per OS specification.
 *
 * This is a FATAL error (non-retryable) because the path violates the OS's rules
 * and won't become valid on retry.
 *
 * This is NOT a semantic error - it violates the filesystem's rules, not yours.
 */
export class FilesystemInvalidPathError extends FatalStorageError {
   constructor(
      public readonly path: string,
      cause?: Error,
   ) {
      super(`Invalid filesystem path: ${path}`, cause)
   }
}

/**
 * Permission denied - insufficient filesystem permissions.
 *
 * This is a FATAL error because permissions won't change on retry.
 */
export class FilesystemPermissionError extends FatalStorageError {
   constructor(
      public readonly path: string,
      cause?: Error,
   ) {
      super(`Permission denied: ${path}`, cause)
   }
}

/**
 * Disk full - no space left on device.
 *
 * This is a FATAL error because it requires manual intervention (free up space).
 */
export class FilesystemNoSpaceError extends FatalStorageError {
   constructor(
      public readonly path: string,
      cause?: Error,
   ) {
      super(`No space left on device: ${path}`, cause)
   }
}

/**
 * Too many open files - resource temporarily unavailable.
 *
 * This is a TRANSIENT error - may self-correct if other processes close files.
 */
export class FilesystemResourceBusyError extends TransientStorageError {
   constructor(
      message: string,
      public readonly path?: string,
      cause?: Error,
   ) {
      super(message, cause)
   }
}

/**
 * Classify a filesystem error into the appropriate typed error.
 *
 * This encapsulates all the error inspection logic that was previously
 * in the middleware's `classifyLocalStorageError()` method.
 *
 * @param error - Raw error from Node.js fs module
 * @param path - Optional path for context
 * @returns Typed StorageError with classification built-in
 */
export function classifyFilesystemError(
   error: Error,
   path?: string,
): FatalStorageError | TransientStorageError {
   const errorMessage = error.message.toLowerCase()
   const errorCode = (error as NodeJS.ErrnoException).code

   // Permission errors
   if (errorCode === "EACCES" || errorMessage.includes("permission denied")) {
      return new FilesystemPermissionError(path ?? "unknown", error)
   }

   // Disk full
   if (errorCode === "ENOSPC" || errorMessage.includes("no space left")) {
      return new FilesystemNoSpaceError(path ?? "unknown", error)
   }

   // Invalid path (OS API violation)
   if (errorCode === "EINVAL" || errorMessage.includes("invalid")) {
      return new FilesystemInvalidPathError(path ?? "unknown", error)
   }

   // Transient errors (resource temporarily unavailable)
   if (
      errorCode === "EMFILE" || // Too many open files
      errorCode === "EAGAIN" || // Resource temporarily unavailable
      errorMessage.includes("busy")
   ) {
      return new FilesystemResourceBusyError(error.message, path, error)
   }

   // Unknown errors default to transient (safe default for retrying)
   return new FilesystemResourceBusyError(
      `Unknown filesystem error: ${error.message}`,
      path,
      error,
   )
}
