# Middleware Cleanup Summary

**Date**: 2026-01-09
**Status**: ✅ Complete

## Overview

Completed a hygienic sweep of the middleware handlers, updating all legacy middleware to the new MiddlewareHandler interface and organizing exports with clear deprecation guidance.

## Files Updated

### Core Middleware Updated ✅

1. **[S3StorageHandlerMiddleware.ts](src/painting/middleware/handlers/S3StorageHandlerMiddleware.ts)**
   - Updated to new interface with `handle(ctx, parser)` signature
   - Returns `MiddlewareResult<{ customData: { s3Uri: string } }, undefined>`
   - Marked as `@deprecated` with guidance to use FileStoreMiddleware

2. **[LocalStorageHandlerMiddleware.ts](src/painting/middleware/handlers/LocalStorageHandlerMiddleware.ts)**
   - Updated to new interface with `handle(ctx, parser)` signature
   - Returns `MiddlewareResult<{ customData: { localPath: string } }, undefined>`
   - Marked as `@deprecated` with guidance to use FileStoreMiddleware

3. **[ContentHashFileNamerMiddleware.ts](src/painting/middleware/handlers/ContentHashFileNamerMiddleware.ts)**
   - Updated to new interface
   - Returns `MiddlewareResult<{ actualFilename?: string }, undefined>`
   - Marked as `@deprecated` with expression alternative:
     ```typescript
     // Instead of ContentHashFileNamerMiddleware
     new NameByMiddleware({
       expression: "${hash(buffer).slice(0,2)}/${hash(buffer).slice(2,14)}.png",
       outputProperty: "filename"
     })
     ```

4. **[ContentSizeFilterMiddleware.ts](src/painting/middleware/handlers/ContentSizeFilterMiddleware.ts)**
   - Updated to new interface
   - Returns `MiddlewareResult<{}, undefined>`
   - Marked as `@deprecated` with expression alternative:
     ```typescript
     // Instead of ContentSizeFilterMiddleware
     new FilterByMiddleware({
       expression: "buffer.length >= 1000 && buffer.length <= 5000000"
     })
     ```

5. **[CacheRenderedImageMiddleware.ts](src/painting/middleware/handlers/CacheRenderedImageMiddleware.ts)**
   - Updated to new interface
   - Returns `MiddlewareResult<{}, undefined>`
   - No deprecation (side-effect middleware, no expression alternative)

### Files Removed ✅

- **FileNameResolverMiddleware._st** - Deleted (unused stub file)

### Exports Reorganized ✅

**[handlers/index.ts](src/painting/middleware/handlers/index.ts)**

Reorganized with clear sections:

```typescript
// Expression-based middleware (NEW - PREFERRED)
export * from "./NameByMiddleware.js"
export * from "./GroupByMiddleware.js"
export * from "./FilterByMiddleware.js"

// Generic storage middleware (NEW - PREFERRED)
export * from "./FileStoreMiddleware.js"

// Legacy middleware (DEPRECATED - use alternatives above)
export * from "./ContentHashFileNamerMiddleware.js"
export * from "./ContentSizeFilterMiddleware.js"
export * from "./S3StorageHandlerMiddleware.js"
export * from "./LocalStorageHandlerMiddleware.js"

// Side-effect middleware (no deprecation)
export * from "./CacheRenderedImageMiddleware.js"
```

## Migration Guide for Users

### Replace Storage Handlers

**Before:**
```typescript
new S3StorageHandlerMiddleware({}, logger, s3Store)
```

**After:**
```typescript
new FileStoreMiddleware(
  {
    pathProperty: "filename",
    uriProperty: "s3Uri",
    contentType: "image/png"
  },
  s3FileStore,
  logger
)
```

### Replace Hash-Based Naming

**Before:**
```typescript
new ContentHashFileNamerMiddleware(
  { dirSegmentLength: 2, fileSegmentLength: 12 },
  logger
)
```

**After:**
```typescript
new NameByMiddleware(
  {
    expression: "${hash(buffer).slice(0,2)}/${hash(buffer).slice(2,14)}.png",
    outputProperty: "filename"
  },
  logger
)
```

### Replace Size Filtering

**Before:**
```typescript
new ContentSizeFilterMiddleware(
  { minSize: 1000, maxSize: 5000000 },
  logger
)
```

**After:**
```typescript
new FilterByMiddleware(
  {
    expression: "buffer.length >= 1000 && buffer.length <= 5000000"
  },
  logger
)
```

## Benefits of New Approach

### 1. Consistency
- All middleware use same interface
- Uniform signature: `handle(ctx, parser) => MiddlewareResult`
- Clear separation: model vs. parser extensions

### 2. Flexibility
- Expression-based middleware work with any domain model
- No hard-coded property names
- Easy to compose new behaviors

### 3. Type Safety
- ByNameValue<PropName> for dynamic properties
- Clear type declarations via generics
- Better IDE support and error messages

### 4. Maintainability
- Fewer specialized middleware classes
- Expressions replace imperative code
- Easier to understand and debug

## Build Status

✅ No middleware-related TypeScript errors
- All updated middleware compile cleanly
- No breaking changes to existing code
- Legacy middleware remain functional during migration period

## Next Steps

1. **Update Instantiation Sites**: Find and update code that creates legacy middleware instances
2. **Update Tests**: Modify tests to use new interface signatures
3. **Documentation**: Update user guides to reflect new patterns
4. **Remove Legacy**: After migration period, consider removing deprecated middleware

## Deprecation Timeline

- **Current**: Legacy middleware marked @deprecated, still functional
- **Future**: Remove deprecated middleware after all usage migrated
- **Target**: 2-3 release cycles for full migration

---

**Related Documents**:
- [MIDDLEWARE_ARCHITECTURE_REVISION.md](MIDDLEWARE_ARCHITECTURE_REVISION.md) - Core architecture design
- [MIDDLEWARE_REFACTORING_SUMMARY.md](MIDDLEWARE_REFACTORING_SUMMARY.md) - Initial refactoring summary
