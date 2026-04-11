# Middleware Context Refactoring

## Overview

The middleware system has been refactored to address several architectural issues:

1. **Context Type Separation** - Split into `ItemContext` (for individual items) and `CollectionContext` (for collection aggregation)
2. **Readonly vs Mutable** - Separated immutable job inputs from mutable processing state
3. **Retry Tracking** - Added retry metadata (attempt number, resume point)
4. **Expression Functions** - Implemented built-in expression functions for filename generation
5. **Single-Item Support** - Made collection fields optional to support non-collection jobs

## Context Types

### ItemContext (Individual Item Processing)

Used by middleware that processes individual items (images).

**Structure:**
```typescript
type ItemContext = ItemContextInput & ItemContextState
```

**ItemContextInput** (readonly):
- `jobId` - Unique job identifier
- `buffer` - Rendered image bytes
- `canvas` - Canvas object (optional)
- `metadata` - Image dimensions and seeds
  - `width`, `height`
  - `seedPrefix`, `seedSuffix` (base64-encoded 16-byte binary)
  - `regionMapCID`
- `filenameExpression` - Optional expression to evaluate
- `executionStrategy` - "WorkerPool" | "OriginNode"
- `collection` - Optional collection context
  - `imageIndex` - Zero-based index within collection
  - `totalImages` - Total items in collection
  - `regionMapNames` - Optional name→CID mapping for `regionMapName()` function

**ItemContextState** (mutable):
- `disposition` - Current job disposition (OK, IGNORE, ERROR, etc.)
- `error` - Error that caused non-OK disposition
- `actualFilename` - Resolved filename for storage
- `customData` - Arbitrary data for downstream middleware
- `retry` - Retry tracking (managed by framework)
  - `attemptNumber` - Current attempt (1-based)
  - `lastCompletedMiddlewareIndex` - For resuming chains
  - `maxAttempts` - Retry limit

### CollectionContext (Collection Aggregation)

Used by middleware that processes aggregated results from multiple child jobs.

**Structure:**
```typescript
type CollectionContext<T> = CollectionContextInput<T> & CollectionContextState
```

**CollectionContextInput** (readonly):
- `jobId` - Parent job identifier
- `collectionResult` - Aggregated child results
  - `results` - Array of child outcomes (success data, nulls, or error markers)
  - `ignoreCounter` - Count of ignored items
  - `errorCounter` - Count of failed items
- `executionStrategy` - "WorkerPool" | "OriginNode"
- `regionMapNames` - Optional name→CID mapping

**CollectionContextState** (mutable):
- `disposition` - Collection-level disposition
- `error` - Collection-level error
- `customData` - Collection metadata (manifests, etc.)
- `retry` - Retry tracking

### Migration from Legacy MiddlewareContext

The old `MiddlewareContext` is deprecated but still functional for backward compatibility.

**Key differences:**
- `imageIndex`, `totalImages`, `isCollectionMode` → moved to `collection` object
- Added `retry` tracking metadata
- Separated readonly inputs from mutable state
- Added `regionMapNames` for expression functions

## Expression Functions

Built-in functions available in `filenameExpression` evaluation:

### `contentHash(length?: number): string`
Generate SHA-256 hash of buffer content.

```javascript
contentHash()      // Returns 12-char hash (default)
contentHash(20)    // Returns 20-char hash
```

**Implementation**: Base64-encoded SHA-256 with `/+=` replaced by `_` for URL safety.

### `asUtf8(base64Str: string): string`
Decode base64-encoded bytes as UTF-8 string.

```javascript
asUtf8(metadata("seedPrefix"))   // Decode prefix to string
asUtf8(metadata("seedSuffix"))   // Decode suffix to string
```

**Use case**: When seeds contain UTF-8 text (though typically they're binary).

### `trim(str: string, maxLength: number): string`
Truncate string to maximum length.

```javascript
trim(contentHash(64), 12)        // Hash then trim to 12 chars
trim(asUtf8(metadata("seedPrefix")), 8)  // Decode then trim
```

### `fileSize(): number`
Get buffer size in bytes.

```javascript
fileSize()  // Returns buffer.length
```

### `regionMapName(cid?: string): string`
Reverse lookup: find human-readable name for a CID.

```javascript
regionMapName()              // Lookup current item's regionMapCID
regionMapName("QmABC...")    // Lookup specific CID
```

**Requires**: `collection.regionMapNames` mapping to be provided in job spec.

**Returns**: Name if found in mapping, otherwise the CID itself.

### `custom(key: string): any`
Access custom data from previous middleware.

```javascript
custom("s3Uri")      // Access ctx.customData.s3Uri
custom("localPath")  // Access ctx.customData.localPath
```

### `imageIndex(): number | undefined`
Get zero-based index within collection.

```javascript
imageIndex()  // Returns 0, 1, 2, etc. (or undefined if not in collection)
```

### `totalImages(): number | undefined`
Get total number of images in collection.

```javascript
totalImages()  // Returns N (or undefined if not in collection)
```

### `metadata(key: string): any`
Access metadata properties.

```javascript
metadata("width")         // Image width
metadata("height")        // Image height
metadata("regionMapCID")  // Region map CID
metadata("seedPrefix")    // Base64-encoded prefix
metadata("seedSuffix")    // Base64-encoded suffix
```

## Expression Examples

### Simple hash-based naming
```javascript
`${contentHash(8)}.png`
// Result: "XyZ_AbC1.png"
```

### Directory structure with hash
```javascript
`${contentHash(2)}/${contentHash(12)}.png`
// Result: "Xy/Z_AbC12345678.png"
```

### Collection with index
```javascript
`img_${imageIndex()}_${contentHash(8)}.png`
// Result: "img_0_XyZ_AbC1.png"
```

### Padded index
```javascript
`${imageIndex() < 10 ? '0' : ''}${imageIndex()}_${regionMapName()}.png`
// Result: "03_landscape.png"
```

### Using metadata
```javascript
`${metadata("width")}x${metadata("height")}_${contentHash(8)}.png`
// Result: "1024x768_XyZ_AbC1.png"
```

### Conditional naming
```javascript
`${fileSize() > 1000000 ? 'large' : 'small'}/${contentHash(12)}.png`
// Result: "large/XyZ_AbC12345.png"
```

## Retry Behavior

The `retry` metadata in context state is managed by the framework (not middleware):

- **`attemptNumber`**: Incremented on each retry (1 = first attempt, 2 = first retry, etc.)
- **`lastCompletedMiddlewareIndex`**: Tracks which middleware succeeded before failure
- **`maxAttempts`**: Configured retry limit

**Retry strategies** (not yet implemented in `MiddlewareChainExecutor`):
- **Restart from beginning**: Set `lastCompletedMiddlewareIndex = undefined`
- **Resume from last success**: Skip to `lastCompletedMiddlewareIndex + 1`
- **Selective retry**: Skip idempotent middleware (e.g., ContentHashFileNamerMiddleware)

## Single-Item vs Collection Jobs

**Single-item jobs**:
- `collection` field is `undefined` in `ItemContext`
- `imageIndex()`, `totalImages()`, `regionMapName()` return `undefined`
- Use item-level middleware only (no collection chain)

**Collection jobs**:
- `collection` field is present in `ItemContext`
- Each child job runs through item-level middleware chain
- Parent job aggregates results and runs collection-level middleware chain
- Collection middleware receives `CollectionContext` with `collectionResult`

## Implementation Files

**Context types**:
- `src/painting/middleware/types/ItemContextInput.ts` - Readonly item inputs
- `src/painting/middleware/types/ItemContextState.ts` - Mutable item state
- `src/painting/middleware/types/ItemContext.ts` - Combined item context
- `src/painting/middleware/types/CollectionContextInput.ts` - Readonly collection inputs
- `src/painting/middleware/types/CollectionContextState.ts` - Mutable collection state
- `src/painting/middleware/types/CollectionContext.ts` - Combined collection context

**Expression evaluator**:
- `src/painting/middleware/expression/BuiltInFunctions.ts` - Built-in function implementations
- `src/painting/middleware/expression/SimpleExpressionEvaluator.ts` - Expression evaluator
- `src/painting/middleware/handlers/FileNameResolverMiddleware.ts` - Uses evaluator

**Legacy**:
- `src/painting/middleware/types/MiddlewareContext.ts` - Deprecated (use `ItemContext` instead)

## Migration Guide

### For Middleware Handlers

**Before** (legacy):
```typescript
class MyMiddleware implements MiddlewareHandler {
   async handle(ctx: MiddlewareContext): Promise<MiddlewareContext> {
      const index = ctx.imageIndex  // Directly on context
      const isCollection = ctx.isCollectionMode
      // ...
   }
}
```

**After** (new):
```typescript
class MyMiddleware implements MiddlewareHandler<ItemContext> {
   async handle(ctx: ItemContext): Promise<ItemContext> {
      const index = ctx.collection?.imageIndex  // Optional collection field
      const isCollection = ctx.collection !== undefined
      // ...
   }
}
```

### For Expression Usage

**Before** (manual hash implementation):
```typescript
const hash = crypto.createHash("sha256")
   .update(buffer)
   .digest("base64")
   .replace(/[/+=]/g, "_")
   .slice(0, 12)
const filename = `${hash}.png`
```

**After** (expression):
```typescript
filenameExpression: "`${contentHash(12)}.png`"
// Or in job spec:
{
   filenameExpression: "`img_${imageIndex()}_${contentHash(8)}.png`"
}
```

## Future Enhancements

1. **Retry resume logic** in `MiddlewareChainExecutor`
2. **Sandboxed expression evaluation** (VM2, isolated-vm) for untrusted expressions
3. **Additional built-in functions**:
   - `timestamp()` - Current Unix timestamp
   - `uuid()` - Generate UUID v4
   - `base32(str)` - Base32 encoding
4. **Collection-specific expression functions** (for collection-level middleware)
5. **Expression compilation caching** for performance
