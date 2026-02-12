# Attic: Legacy Middleware Handlers

**Date Archived**: 2026-01-09

## Overview

These middleware handlers were moved to the attic during the middleware architecture refactoring. They have been replaced by more flexible, expression-based alternatives.

## Archived Files

### S3StorageHandlerMiddleware.ts
**Replaced by**: `FileStoreMiddleware` with `S3FileStore` injection

**Migration**:
```typescript
// OLD
new S3StorageHandlerMiddleware({}, logger, s3Store)

// NEW
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

### LocalStorageHandlerMiddleware.ts
**Replaced by**: `FileStoreMiddleware` with `LocalFileStore` injection

**Migration**:
```typescript
// OLD
new LocalStorageHandlerMiddleware({}, logger, localStorage)

// NEW
new FileStoreMiddleware(
  {
    pathProperty: "filename",
    uriProperty: "localPath",
    contentType: "image/png"
  },
  localFileStore,
  logger
)
```

### ContentHashFileNamerMiddleware.ts
**Replaced by**: `NameByMiddleware` with hash() expression

**Migration**:
```typescript
// OLD
new ContentHashFileNamerMiddleware(
  { dirSegmentLength: 2, fileSegmentLength: 12, extension: "png" },
  logger
)

// NEW
new NameByMiddleware(
  {
    expression: "${hash(buffer).slice(0,2)}/${hash(buffer).slice(2,14)}.png",
    outputProperty: "filename"
  },
  logger
)
```

### ContentSizeFilterMiddleware.ts
**Replaced by**: `FilterByMiddleware` with buffer.length expression

**Migration**:
```typescript
// OLD
new ContentSizeFilterMiddleware(
  { minSize: 1000, maxSize: 5000000, isFatal: false },
  logger
)

// NEW
new FilterByMiddleware(
  {
    expression: "buffer.length >= 1000 && buffer.length <= 5000000"
  },
  logger
)
```

## Why These Were Archived

### Redundancy
- **S3/LocalStorageHandlerMiddleware**: Duplicate implementations of the same storage pattern
- **FileStoreMiddleware**: Single implementation works with any `IFileStore` (S3, Local, etc.)

### Inflexibility
- **ContentHashFileNamerMiddleware**: Hard-coded SHA-256 hashing logic
- **NameByMiddleware**: Any expression including `hash()`, `slice()`, domain properties, etc.

### Lack of Composability
- **ContentSizeFilterMiddleware**: Only filters by size
- **FilterByMiddleware**: Can filter by size, content properties, domain logic, etc.

## Benefits of New Approach

1. **Single Storage Handler**: One `FileStoreMiddleware` works with all stores
2. **Expression Language**: Powerful, declarative, no code changes for new behaviors
3. **Model-Agnostic**: Expression middleware work with any domain model
4. **Type-Safe**: `ByNameValue<PropName>` ensures property name correctness
5. **Parser Extensions**: Custom functions can be added without new middleware classes

## Related Documentation

- [MIDDLEWARE_ARCHITECTURE_REVISION.md](../../../../MIDDLEWARE_ARCHITECTURE_REVISION.md) - Architecture design
- [MIDDLEWARE_REFACTORING_SUMMARY.md](../../../../MIDDLEWARE_REFACTORING_SUMMARY.md) - Implementation summary
- [MIDDLEWARE_CLEANUP_SUMMARY.md](../../../../MIDDLEWARE_CLEANUP_SUMMARY.md) - Cleanup details
