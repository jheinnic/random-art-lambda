# Storage Abstraction Progress

## Completed

### 1. Unified IFileStore Interface ✅

Created `/src/storage/interface/IFileStore.ts` with:
- `write(path, data, metadata?)` - write buffer to storage
- `read(path)` - read buffer from storage
- `delete(path)` - delete file from storage
- `exists(path)` - check if file exists
- `getBaseUri()` - get storage base URI

**FileMetadata** interface supports:
- `contentType` - MIME type
- `tags` - custom key/value tags
- `cacheControl` - cache headers
- `contentEncoding` - content encoding

### 2. S3ResultStore Updated ✅

Modified `/src/storage/components/S3ResultStore.ts` to:
- Implement both `IFileStore` (new) and `IResultStore` (legacy) interfaces
- Use method overloading for `write()` to support both signatures:
  - `write(path, data, contentType?)` - IResultStore legacy
  - `write(path, data, metadata?)` - IFileStore new
- Added `read()` method using `fileStore.read()`
- Added `delete()` method (throws error - FileStore doesn't support deletion)
- Added `getBaseUri()` method

**Note**: FileStore from @aztec/stdlib doesn't provide delete functionality

### 3. IResultStore Deprecated ✅

Marked `/src/storage/interface/IResultStore.ts` as deprecated with migration notes:
- All methods marked `@deprecated` with migration path
- Interface kept for backward compatibility during transition

## Remaining Tasks

### 4. LocalResultStore Update ⏳

Need to update `/src/storage/components/LocalResultStore.ts` to:
- Implement `IFileStore` interface
- Use method overloading like S3ResultStore
- Add `read()`, `delete()`, `getBaseUri()` methods
- Ensure error classification uses `classifyFilesystemError()`

### 5. Create Generic FileStoreMiddleware ⏳

Create `/src/painting/middleware/handlers/FileStoreMiddleware.ts`:
- Works with any `IFileStore` implementation
- Injected via DI token
- Reads filename from configurable context property (e.g., `s3Path`, `localPath`)
- Sets URI in output property
- Uses `StorageError.isRetryable()` for disposition

### 6. DI Tokens ⏳

Create `/src/storage/tokens.ts`:
```typescript
export const S3_FILE_STORE = Symbol('S3_FILE_STORE')
export const LOCAL_FILE_STORE = Symbol('LOCAL_FILE_STORE')
```

### 7. Update Middleware to Use IFileStore ⏳

Files to update:
- `S3StorageHandlerMiddleware.ts` - migrate to use FileStoreMiddleware or update to use IFileStore
- `LocalStorageHandlerMiddleware.ts` - migrate to use FileStoreMiddleware or update to use IFileStore

## Architecture Benefits

1. **Unified Interface**: Single `IFileStore` interface for all storage backends
2. **Error Classification**: All storage errors use `StorageError.isRetryable()`
3. **Backward Compatible**: Existing code continues to work via `IResultStore`
4. **DI Ready**: Can inject different stores via tokens
5. **Testable**: Easy to mock `IFileStore` for testing

## Next Steps

1. Update `LocalResultStore` to implement `IFileStore`
2. Create `FileStoreMiddleware` that works with any `IFileStore`
3. Define DI tokens for store injection
4. Update existing storage middleware to use new abstraction

---

**Status**: Foundation complete, implementation in progress
**Last Updated**: 2026-01-08
