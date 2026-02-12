# Middleware Implementation Progress

## Completed Tasks ✅

### 1. Storage Abstraction
- ✅ Created `IFileStore` interface with `write()`, `read()`, `delete()`, `exists()`, `getBaseUri()`
- ✅ Created `FileMetadata` interface for structured metadata
- ✅ Updated `S3ResultStore` to implement both `IFileStore` and `IResultStore` (legacy)
- ✅ Updated `LocalResultStore` to implement both interfaces
- ✅ Used method overloading to support both signatures
- ✅ Deprecated `IResultStore` with migration notes
- ✅ All storage errors use `StorageError.isRetryable()` pattern

### 2. Dependency Injection Tokens
- ✅ Created `/src/storage/tokens.ts` with:
  - `S3_FILE_STORE` - for S3 storage
  - `LOCAL_FILE_STORE` - for local filesystem
  - `WORKER_FILE_STORE` - primary store for worker nodes
  - `LOCAL_NODE_FILE_STORE` - store for origin/local nodes

### 3. Generic File Store Middleware
- ✅ Created `FileStoreMiddleware` that works with any `IFileStore`
- ✅ Configurable path and URI property names
- ✅ Reads from `ctx[pathProperty]` (e.g., "s3Path")
- ✅ Writes to `ctx[uriProperty]` (e.g., "s3Uri")
- ✅ Uses `StorageError.isRetryable()` for disposition

### 4. Expression Evaluation System
- ✅ Created `ExpressionEvaluator` service using `jse-eval`
- ✅ Built-in core functions:
  - `hash(data)` - SHA-256 content hash
  - `slice(str, start, end)` - string slicing
  - `length(data)` - buffer/string length
  - `get(obj, key)` - array/object access
- ✅ Support for parser extension classes with static methods
- ✅ Safe sandboxed evaluation

### 5. Expression-Based Middleware
- ✅ `NameByMiddleware` - evaluates nameBy expression to generate filename
- ✅ `GroupByMiddleware` - evaluates groupBy expression for aggregation
- ✅ `FilterByMiddleware` - evaluates filterBy expression for conditional processing
- ✅ All middleware support:
  - Access to task/project domain models
  - Built-in functions
  - Custom parser extensions
  - Configurable output properties

### 6. Exports and Organization
- ✅ Updated `/src/painting/middleware/handlers/index.ts`
- ✅ Marked legacy middleware with deprecation comments
- ✅ Exported new expression-based middleware

## Architecture Summary

### Worker Stage Middleware Chain (Example)
```typescript
const workerChain = [
   // 1. Render image (produces buffer)
   new RenderMiddleware(),

   // 2. Evaluate filter expression
   new FilterByMiddleware({
      expression: "buffer.length < 5000000",
      evaluator: expressionEvaluator
   }),

   // 3. Evaluate group expression
   new GroupByMiddleware({
      expression: "${task.campaign}",
      outputProperty: "groupId",
      evaluator: expressionEvaluator
   }),

   // 4. Evaluate name expression
   new NameByMiddleware({
      expression: "${task.campaign}/${hash(buffer).slice(0,12)}.png",
      outputProperty: "s3Path",
      evaluator: expressionEvaluator
   }),

   // 5. Write to S3
   new FileStoreMiddleware(
      { pathProperty: "s3Path", uriProperty: "s3Uri" },
      s3FileStore
   )
]
```

### Local Stage Middleware Chain (Example)
```typescript
const localChain = [
   // 1. Fetch from S3 (reads ctx.s3Uri)
   new S3FetchMiddleware(),

   // 2. Content analysis (extends model)
   new ColorAnalysisMiddleware(),  // Adds colorHistogram to ctx

   // 3. Evaluate filter with extended model
   new FilterByMiddleware({
      expression: "${colorHistogram.dominantHue !== 'red'}",
      parserExtension: ImageMetricsExtension,
      evaluator: expressionEvaluator
   }),

   // 4. Evaluate local name with content properties
   new NameByMiddleware({
      expression: "${task.category}/${getDominantHue()}.png",
      outputProperty: "localPath",
      parserExtension: ImageMetricsExtension,
      evaluator: expressionEvaluator
   }),

   // 5. Write to local filesystem
   new FileStoreMiddleware(
      { pathProperty: "localPath", uriProperty: "localUri" },
      localFileStore
   ),

   // 6. Clean up S3 staging file (if TRANSIENT_S3)
   new S3CleanupMiddleware()
]
```

## Files Created

### Storage Layer
- `/src/storage/interface/IFileStore.ts` - Unified storage interface
- `/src/storage/tokens.ts` - DI injection tokens

### Expression System
- `/src/painting/middleware/expression/ExpressionEvaluator.ts` - Expression evaluation service

### Middleware Handlers
- `/src/painting/middleware/handlers/FileStoreMiddleware.ts` - Generic storage middleware
- `/src/painting/middleware/handlers/NameByMiddleware.ts` - Filename generation
- `/src/painting/middleware/handlers/GroupByMiddleware.ts` - Group aggregation
- `/src/painting/middleware/handlers/FilterByMiddleware.ts` - Conditional filtering

### Documentation
- `/STORAGE_ABSTRACTION_PROGRESS.md` - Storage layer progress
- `/MIDDLEWARE_IMPLEMENTATION_PROGRESS.md` - This file

## Files Modified

### Storage Layer
- `/src/storage/components/S3ResultStore.ts` - Implements IFileStore
- `/src/storage/components/LocalResultStore.ts` - Implements IFileStore
- `/src/storage/interface/IResultStore.ts` - Marked deprecated

### Exports
- `/src/painting/middleware/handlers/index.ts` - Added new middleware exports

## Remaining Tasks

### 1. Worker Preset Registry ⏳
Create predefined worker configurations:
```typescript
// /src/painting/middleware/config/WorkerPresets.ts
const WORKER_PRESETS = {
   "standard-s3": {
      middlewareChain: [...],
      allowedFunctions: ["hash", "slice", "length"]
   },
   "high-quality-s3": { ... },
   "local-only": { ... }
}
```

### 2. Configuration System Updates ⏳
Update `/src/painting/artwork/di/Configuration.ts`:
- Remove `ParserContext` enum (structural context determines scope)
- Add `cacheStrategy` enum value (not expression)
- Split into `worker` and `local` sections
- Add worker preset selection
- Type-safe output property tracking

### 3. Dynamic Module Factory ⏳
Create `/src/painting/artwork/di/DynamicModuleFactory.ts`:
- Read `SingleContentDependence` configuration
- Select worker preset or build custom local chain
- Register DI providers for file stores
- Create `MiddlewareChainExecutor` instances
- Wire up expression evaluator with parser extensions

### 4. NestJS Module Integration ⏳
- Register `ExpressionEvaluator` as provider
- Register `IFileStore` implementations with tokens
- Configure worker vs local file store selection
- Inject middleware dependencies

### 5. Migration Path for Existing Code ⏳
Deprecate and replace:
- `FileNameResolverMiddleware` → `NameByMiddleware`
- `ContentHashFileNamerMiddleware` → Built-in `hash()` function in expressions
- `S3StorageHandlerMiddleware` → `FileStoreMiddleware` with S3 store
- `LocalStorageHandlerMiddleware` → `FileStoreMiddleware` with local store

## Key Architectural Decisions

### 1. Expression Independence
All expressions at the same tier (`nameBy`, `groupBy`, `filterBy`) evaluate independently using identical parser context. They cannot reference each other's outputs.

### 2. Worker Pool Constraints
Worker nodes use **predefined configurations** only. Custom middleware and parser extensions are restricted to local/origin nodes for security.

### 3. Two-Tier Model System
- **SourceModel**: Readonly domain properties (task, project)
- **OutputModel**: SourceModel + content-derived properties (from transform middleware)

### 4. Storage Abstraction
Single `IFileStore` interface works with any backend. Error classification happens at the storage layer via `StorageError.isRetryable()`.

### 5. DI Token Strategy
Separate tokens for S3/local stores, plus role-based tokens (`WORKER_FILE_STORE`, `LOCAL_NODE_FILE_STORE`) for configuration flexibility.

## Next Steps

1. **Implement Worker Presets** - Define standard worker configurations
2. **Update Configuration Types** - Remove ParserContext, add cache strategy
3. **Build Dynamic Module Factory** - Wire configuration to middleware chains
4. **Integration Testing** - Test full worker→local flow
5. **Migration Guide** - Document upgrade path for existing users

---

**Status**: Core implementation complete, integration pending
**Last Updated**: 2026-01-08
