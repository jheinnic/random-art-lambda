# SEMANTIC_ERROR Classification Fix

## Problem

The codebase was misusing `JobDisposition.SEMANTIC_ERROR` for external API contract violations (AWS S3, filesystem OS) instead of reserving it for application-specific business rule violations.

## Key Principle

**SEMANTIC_ERROR** should ONLY be used when input violates **your application's domain rules**, not when it violates an external dependency's API contract.

### Correct Boundary

| Error Source | Correct Disposition | Example |
|--------------|---------------------|---------|
| **Application business rules** | `SEMANTIC_ERROR` | Valid 1024x768 image rejected by "must be square" rule |
| **Application business rules** | `SEMANTIC_ERROR` | Valid S3 key `"apple/pie.png"` rejected by "must start with color name" rule |
| **Application business rules** | `SEMANTIC_ERROR` | Valid region map name not in application's allowlist |
| **Application business rules** | `SEMANTIC_ERROR` | Image size violates minSize/maxSize business constraints |
| **AWS S3 API contract** | `FATAL_ERROR` | Invalid bucket name per S3 specification |
| **AWS S3 API contract** | `FATAL_ERROR` | Invalid S3 key characters per S3 specification |
| **Filesystem OS contract** | `FATAL_ERROR` | `EINVAL` - invalid path per OS specification |
| **Middleware chain contract** | `FATAL_ERROR` | Missing required field (misconfigured chain) |

## Files Fixed

### 1. [S3StorageHandlerMiddleware.ts](src/painting/middleware/handlers/S3StorageHandlerMiddleware.ts)

**Before**: Lines 74-80
```typescript
// Semantic errors (invalid input)
if (
   errorMessage.includes("invalid bucket name") ||
   errorMessage.includes("invalid key")
) {
   return JobDisposition.SEMANTIC_ERROR
}
```

**After**: Lines 77-84
```typescript
// Fatal errors: AWS API contract violations (malformed input per S3 spec)
// These are NOT semantic errors - they violate S3's rules, not ours
if (
   errorMessage.includes("invalid bucket name") ||
   errorMessage.includes("invalid key")
) {
   return JobDisposition.FATAL_ERROR
}
```

**Rationale**: Invalid bucket/key names are AWS's validation rules, not application business rules.

---

### 2. [LocalStorageHandlerMiddleware.ts](src/painting/middleware/handlers/LocalStorageHandlerMiddleware.ts)

**Before**: Lines 86-89
```typescript
// Semantic errors (invalid path)
if (errorCode === "EINVAL" || errorMessage.includes("invalid")) {
   return JobDisposition.SEMANTIC_ERROR
}
```

**After**: Lines 89-93
```typescript
// Fatal errors: filesystem API violations (invalid path per OS spec)
// These are NOT semantic errors - they violate the OS's rules, not ours
if (errorCode === "EINVAL" || errorMessage.includes("invalid")) {
   return JobDisposition.FATAL_ERROR
}
```

**Rationale**: `EINVAL` from filesystem is the OS's validation, not application semantic rules.

---

### 3. [JobDisposition.ts](src/painting/middleware/types/JobDisposition.ts)

**Before**: Lines 27-30
```typescript
/**
 * Input validation failure - semantically invalid input
 */
SEMANTIC_ERROR = "SEMANTIC_ERROR",
```

**After**: Lines 27-42
```typescript
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
```

**Rationale**: Added explicit guidance on semantic error boundary.

---

## Verified Correct Usage

### [ContentSizeFilterMiddleware.ts](src/painting/middleware/handlers/ContentSizeFilterMiddleware.ts)

Lines 67 and 80 correctly use `SEMANTIC_ERROR`:

```typescript
disposition: this.isFatal
   ? JobDisposition.SEMANTIC_ERROR
   : JobDisposition.IGNORE,
```

**Why this is correct**:
- The PNG buffer is valid per PNG specification
- The size limits (minSize/maxSize) are **application business rules**
- Rejecting based on size is a domain constraint, not an API violation

This is analogous to the "square images only" example - the image is technically valid, but violates the application's semantic requirements.

---

## Remaining Questions

### MissingRequiredFieldError Usage

Several middleware use `SEMANTIC_ERROR` when required fields are missing:

**S3StorageHandlerMiddleware.ts:26**
```typescript
if (!ctx.actualFilename) {
   return {
      ...ctx,
      disposition: JobDisposition.SEMANTIC_ERROR,
      error: new MissingRequiredFieldError("actualFilename must be set..."),
   }
}
```

**Analysis**: This could be:
- `SEMANTIC_ERROR` if the **user** was required to provide filename in their job request (user violated API)
- `FATAL_ERROR` if this indicates misconfigured middleware chain (programming error)

**Recommendation**: Depends on whether this is user input validation or internal chain contract enforcement.

---

### FileNameResolverMiddleware Expression Errors

**FileNameResolverMiddleware.ts:79**
```typescript
// Expression evaluation errors are semantic
return {
   ...ctx,
   disposition: JobDisposition.SEMANTIC_ERROR,
   error: error as Error,
}
```

**Analysis**: This could be:
- `SEMANTIC_ERROR` if expression syntax is valid but produces invalid result per business rules
- `FATAL_ERROR` if expression has syntax errors or references undefined functions

**Recommendation**: May need to distinguish between expression syntax errors (FATAL) vs expression result validation (SEMANTIC).

---

## Summary

**Fixed**: External API contract violations (AWS S3, filesystem OS) now correctly classified as `FATAL_ERROR`

**Correct**: Application business rules (size limits, etc.) continue to use `SEMANTIC_ERROR`

**Clarified**: Added comprehensive documentation to `JobDisposition.SEMANTIC_ERROR` explaining the boundary

The key insight: **Semantic errors must originate from your application's domain logic, not from external dependencies.**
