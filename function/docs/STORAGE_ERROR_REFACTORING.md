# Storage Error Classification Refactoring

## Overview

Moved error classification logic from middleware (consumers) to file store services (producers). The component closest to the error source now classifies it, and consumers benefit from a simple, generalized `isRetryable()` interface.

## Problem Solved

**Before**: Middleware had to inspect error messages and codes to classify errors:

```typescript
// Middleware had error classification logic
private classifyS3Error(error: Error): JobDisposition {
   const errorMessage = error.message.toLowerCase()
   const errorName = error.name

   if (errorMessage.includes("invalid bucket name") || ...) {
      return JobDisposition.FATAL_ERROR
   }
   // ... 40 more lines of classification logic
}
```

**Issues**:
- Duplicated classification logic across S3 and Local storage middleware
- Tight coupling to error message strings (fragile)
- No reusability for other consumers (workers, queues, etc.)
- Violates single responsibility principle (middleware doing storage's job)

**After**: Storage services throw typed errors with built-in classification:

```typescript
// Storage throws classified errors
throw new S3InvalidInputError(error.message, bucket, key, error)

// Middleware uses simple interface
const disposition = error instanceof StorageError && error.isRetryable()
   ? JobDisposition.TRANSIENT_ERROR
   : JobDisposition.FATAL_ERROR
```

**Benefits**:
- Classification logic lives with the storage layer (correct responsibility)
- Reusable by any consumer (middleware, workers, queue handlers)
- Type-safe error handling with specific error classes
- Simple `isRetryable()` interface - no message inspection needed

---

## Architecture

### Base Error Class

**[src/storage/errors/StorageError.ts](src/storage/errors/StorageError.ts)**

```typescript
export abstract class StorageError extends Error {
   abstract isRetryable(): boolean

   isApiContractViolation(): boolean {
      return true  // Storage errors are API violations by default
   }

   constructor(message: string, public readonly cause?: Error)
}

export class TransientStorageError extends StorageError {
   isRetryable(): boolean { return true }
}

export class FatalStorageError extends StorageError {
   isRetryable(): boolean { return false }
}
```

**Design**:
- `isRetryable()` - Simple boolean interface for all consumers
- `isApiContractViolation()` - Distinguishes external API errors from semantic errors
- Cause chaining - Preserves original error stack traces

---

### S3 Errors

**[src/storage/errors/S3StorageError.ts](src/storage/errors/S3StorageError.ts)**

Specific error types:

| Error Class | Extends | Retryable | Description |
|-------------|---------|-----------|-------------|
| `S3InvalidInputError` | Fatal | No | Invalid bucket/key per S3 spec |
| `S3BucketNotFoundError` | Fatal | No | Bucket doesn't exist |
| `S3PermissionError` | Fatal | No | Access denied |
| `S3NetworkError` | Transient | Yes | Timeout/network issues |

**Classification function**:

```typescript
export function classifyS3Error(
   error: Error,
   bucket?: string,
   key?: string,
): FatalStorageError | TransientStorageError {
   const errorMessage = error.message.toLowerCase()
   const errorName = error.name

   // AWS API contract violations
   if (errorMessage.includes("invalid bucket name") ||
       errorMessage.includes("invalid key")) {
      return new S3InvalidInputError(error.message, bucket, key, error)
   }

   // Bucket not found
   if (errorName === "NoSuchBucket") {
      return new S3BucketNotFoundError(bucket ?? "unknown", error)
   }

   // Permission errors
   if (errorName === "AccessDenied" ||
       errorMessage.includes("access denied")) {
      return new S3PermissionError(error.message, bucket, key, error)
   }

   // Network/timeout errors (transient)
   if (errorMessage.includes("timeout") ||
       errorMessage.includes("network")) {
      return new S3NetworkError(error.message, error)
   }

   // Unknown errors default to transient (safe for retrying)
   return new S3NetworkError(`Unknown S3 error: ${error.message}`, error)
}
```

**Key decision**: Unknown errors default to `TransientStorageError` (safe default for retrying).

---

### Filesystem Errors

**[src/storage/errors/LocalStorageError.ts](src/storage/errors/LocalStorageError.ts)**

Specific error types:

| Error Class | Extends | Retryable | Description |
|-------------|---------|-----------|-------------|
| `FilesystemInvalidPathError` | Fatal | No | Invalid path per OS spec (EINVAL) |
| `FilesystemPermissionError` | Fatal | No | Permission denied (EACCES) |
| `FilesystemNoSpaceError` | Fatal | No | Disk full (ENOSPC) |
| `FilesystemResourceBusyError` | Transient | Yes | Too many open files (EMFILE, EAGAIN) |

**Classification function**:

```typescript
export function classifyFilesystemError(
   error: Error,
   path?: string,
): FatalStorageError | TransientStorageError {
   const errorCode = (error as NodeJS.ErrnoException).code

   // Permission errors
   if (errorCode === "EACCES") {
      return new FilesystemPermissionError(path ?? "unknown", error)
   }

   // Disk full
   if (errorCode === "ENOSPC") {
      return new FilesystemNoSpaceError(path ?? "unknown", error)
   }

   // Invalid path (OS API violation)
   if (errorCode === "EINVAL") {
      return new FilesystemInvalidPathError(path ?? "unknown", error)
   }

   // Transient errors (resource temporarily unavailable)
   if (errorCode === "EMFILE" || errorCode === "EAGAIN") {
      return new FilesystemResourceBusyError(error.message, path, error)
   }

   // Unknown errors default to transient
   return new FilesystemResourceBusyError(
      `Unknown filesystem error: ${error.message}`,
      path,
      error,
   )
}
```

---

## Storage Implementation Changes

### S3ResultStore

**[src/storage/components/S3ResultStore.ts](src/storage/components/S3ResultStore.ts)**

```typescript
import { classifyS3Error } from "../errors/S3StorageError.js"

async write(path: string, data: Buffer, contentType?: string): Promise<string> {
   try {
      const uri = await this.fileStore.save(path, data, {
         metadata: contentType ? { "Content-Type": contentType } : undefined,
      })
      return uri
   } catch (error) {
      // Classify and re-throw as typed StorageError
      throw classifyS3Error(error as Error, undefined, path)
   }
}
```

**Key change**: Catch, classify, and re-throw. The middleware receives a typed `StorageError`.

---

### LocalResultStore

**[src/storage/components/LocalResultStore.ts](src/storage/components/LocalResultStore.ts)**

```typescript
import { classifyFilesystemError } from "../errors/LocalStorageError.js"

async write(path: string, data: Buffer): Promise<string> {
   try {
      const dir = dirname(path)
      await mkdir(dir, { recursive: true })
      await writeFile(path, data)
      return path
   } catch (error) {
      // Classify and re-throw as typed StorageError
      throw classifyFilesystemError(error as Error, path)
   }
}

async writeStream(path: string, stream: Readable): Promise<string> {
   try {
      const dir = dirname(path)
      await mkdir(dir, { recursive: true })
      const writeStream = createWriteStream(path)
      await pipeline(stream, writeStream)
      return path
   } catch (error) {
      // Classify and re-throw as typed StorageError
      throw classifyFilesystemError(error as Error, path)
   }
}
```

---

## Middleware Simplification

### Before

**S3StorageHandlerMiddleware** (73 lines total):

```typescript
catch (error) {
   this.logger.error(`Failed to write to S3: ${ctx.actualFilename}`, ...)

   return {
      ...ctx,
      disposition: this.classifyS3Error(error as Error),
      error: error as Error,
   }
}

private classifyS3Error(error: Error): JobDisposition {
   const errorMessage = error.message.toLowerCase()
   const errorName = error.name

   // 40+ lines of classification logic
   if (errorMessage.includes("invalid bucket name") || ...) { ... }
   if (errorName === "NoSuchBucket" || ...) { ... }
   if (errorMessage.includes("timeout") || ...) { ... }
   // ... etc
}
```

### After

**S3StorageHandlerMiddleware** (74 lines total, but simpler):

```typescript
import { StorageError } from "../../../storage/errors/StorageError.js"

catch (error) {
   this.logger.error(`Failed to write to S3: ${ctx.actualFilename}`, ...)

   // Storage errors come pre-classified with isRetryable()
   const disposition =
      error instanceof StorageError && error.isRetryable()
         ? JobDisposition.TRANSIENT_ERROR
         : JobDisposition.FATAL_ERROR

   return {
      ...ctx,
      disposition,
      error: error as Error,
   }
}
```

**Benefits**:
- Removed 40+ lines of classification logic
- No string inspection, no error code checking
- Simple instanceof + isRetryable() check
- Same logic works for both S3 and Local storage middleware

---

## Usage Benefits

### 1. Middleware (Current Use Case)

```typescript
try {
   await this.s3Store.write(path, buffer)
} catch (error) {
   const disposition = error instanceof StorageError && error.isRetryable()
      ? JobDisposition.TRANSIENT_ERROR
      : JobDisposition.FATAL_ERROR
}
```

### 2. BullMQ Workers (Future Use Case)

```typescript
try {
   await this.s3Store.write(path, buffer)
} catch (error) {
   if (error instanceof StorageError && error.isRetryable()) {
      // Let BullMQ retry
      throw error
   } else {
      // Mark job as failed, don't retry
      return { failed: true, error }
   }
}
```

### 3. Direct Consumers

```typescript
try {
   await storage.write(path, data)
} catch (error) {
   if (error instanceof S3InvalidInputError) {
      console.log(`Invalid S3 path: bucket=${error.bucket}, key=${error.key}`)
   } else if (error instanceof FilesystemPermissionError) {
      console.log(`Permission denied: ${error.path}`)
   } else if (error instanceof StorageError && error.isRetryable()) {
      console.log(`Transient error, will retry`)
   }
}
```

### 4. Error Reporting

```typescript
if (error instanceof StorageError) {
   logger.error({
      errorType: error.constructor.name,
      isRetryable: error.isRetryable(),
      isApiViolation: error.isApiContractViolation(),
      cause: error.cause,
   })
}
```

---

## Key Design Decisions

### 1. Unknown Errors Default to Transient

Both classifiers return transient errors for unknown cases:

```typescript
// S3
return new S3NetworkError(`Unknown S3 error: ${error.message}`, error)

// Filesystem
return new FilesystemResourceBusyError(`Unknown filesystem error: ...`, error)
```

**Rationale**: Safe default for retry logic. Better to retry and fail again than to give up on a potentially transient issue.

### 2. Error Classification Lives in Storage Layer

The `classifyS3Error()` and `classifyFilesystemError()` functions live in the storage module, not middleware.

**Rationale**:
- Storage layer understands AWS/OS error semantics
- Reusable by any consumer (not just middleware)
- Single source of truth for classification rules

### 3. Typed Errors Over Error Codes

Using distinct error classes instead of error codes or flags.

**Rationale**:
- Type-safe error handling
- IDE autocomplete and type checking
- Preserves metadata (bucket, key, path)
- Clear semantic meaning

### 4. isApiContractViolation() Method

Base class includes `isApiContractViolation()` to distinguish from semantic errors.

**Rationale**: Helps middleware distinguish between:
- `FATAL_ERROR` (API violation: invalid S3 key per AWS spec)
- `SEMANTIC_ERROR` (business rule: image doesn't meet "square" requirement)

---

## Migration Path for Other Consumers

If other parts of the codebase catch storage errors:

```typescript
// Old pattern
try {
   await storage.write(path, data)
} catch (error) {
   if (error.message.includes("timeout")) {
      // retry
   }
}

// New pattern
try {
   await storage.write(path, data)
} catch (error) {
   if (error instanceof StorageError && error.isRetryable()) {
      // retry
   }
}
```

---

## Testing

Mock storage errors for testing:

```typescript
// Test retryable behavior
const error = new S3NetworkError("Connection timeout")
expect(error.isRetryable()).toBe(true)

// Test fatal behavior
const error = new S3InvalidInputError("Invalid bucket name", "my_bucket")
expect(error.isRetryable()).toBe(false)
expect(error.bucket).toBe("my_bucket")

// Test middleware classification
const middleware = new S3StorageHandlerMiddleware(...)
const mockStore = {
   write: jest.fn().mockRejectedValue(new S3NetworkError("timeout"))
}
const result = await middleware.handle(ctx)
expect(result.disposition).toBe(JobDisposition.TRANSIENT_ERROR)
```

---

## Summary

**What Changed**:
- ✅ Created `StorageError` base class hierarchy
- ✅ Added S3-specific error types with `classifyS3Error()`
- ✅ Added filesystem-specific error types with `classifyFilesystemError()`
- ✅ Updated `S3ResultStore` to throw typed errors
- ✅ Updated `LocalResultStore` to throw typed errors
- ✅ Simplified middleware error handling (40+ lines removed per middleware)

**Benefits**:
- ✅ Generalized `isRetryable()` interface for all consumers
- ✅ Error classification logic lives in storage layer (correct responsibility)
- ✅ Type-safe error handling with specific error classes
- ✅ No more brittle string inspection in consumers
- ✅ Reusable by workers, queues, and other consumers

**Principle Applied**:
> The component closest to the error source should classify it.

Storage knows AWS/OS semantics → Storage classifies errors → Consumers use simple interface.
