# DTO Integration with Middleware Context

## Current DTO Architecture Analysis

### Request DTOs

**SinglePaintingTaskRequest** - Individual render task:
```typescript
{
  taskId: ULIDString
  paintableSeed: GenModelSeed { prefix, suffix }
  spatialBoundary: SpatialBoundary
  paintResolution: PaintResolution
  plotDataRef: PlotDataRef
  paintingDomain: PaintingDomain  // Generic domain model from submitter
}
```

**MultiTaskRequestModel** - Project with multiple tasks:
```typescript
{
  projectId: ULIDString
  projectDomain: ProjectDomain  // Project-level domain model
  resourceMapNames: Record<string, CIDString>  // Friendly names → CIDs
  taskUnits: Array<SinglePaintingTaskRequest<PaintingDomain>>
}
```

**PartialPaintRequest** - Fragment of a larger canvas:
```typescript
{
  taskId: ULIDString
  paintableSeed: GenModelSeed
  spatialBoundary: SpatialBoundary
  paintResolution: PaintResolution
  plotDataRef: PlotDataRef
  partialSlice: CanvasFragment { partIndex, totalParts, firstRow, lastRow }
}
```

### Result DTOs

**TaskResultRecord** - Outcome of a task:
```typescript
{
  originalIndex: number
  outcomeType: OutcomeType  // OK, IGNORED, SEMANTIC_ERROR, FATAL_ERROR, OUT_OF_RETRIES
  reportIfCompleted?: {
    groupPositions: Record<string, number>
    wasStaged: boolean
    locationIfStaged?: StagedTaskPaths { primaryPath, hardLinks, extraCopies }
    wasCached: CacheKeyType  // NOT_CACHED, PRIMARY_STAGING_PATH, TASK_ULID
  }
  errorIfFailed?: string
}
```

## Key Observations

1. **DTO OutcomeType ↔ Middleware JobDisposition**:
   - Near 1:1 mapping but different names
   - DTOs use: OK, IGNORED, SEMANTIC_ERROR, FATAL_ERROR, OUT_OF_RETRIES
   - Middleware uses: OK, IGNORE, SEMANTIC_ERROR, FATAL_ERROR, TRANSIENT_ERROR, OUT_OF_RETRIES

2. **Generic Domain Models**:
   - `PaintingDomain` - Task-level custom data
   - `ProjectDomain` - Project-level custom data
   - These map naturally to `ItemContext.customData` and `CollectionContext.customData`

3. **resourceMapNames → regionMapNames**:
   - `MultiTaskRequestModel.resourceMapNames` is exactly what `ItemContext.collection.regionMapNames` needs
   - Enables `regionMapName()` expression function

4. **Cache Key Strategy**:
   - `CacheKeyType` enum shows three caching strategies
   - This informs the LRU cache key generation strategy

5. **Partial Canvas Support**:
   - `CanvasFragment` indicates support for rendering parts of large images
   - Current `ItemContext` assumes full canvas - needs extension

## Proposed Integration

### 1. DTO → ItemContext Mapping

**Create adapter function**:
```typescript
function createItemContextFromDTO(
  request: SinglePaintingTaskRequest<any>,
  buffer: Buffer,
  canvas?: Canvas,
  collection?: {
    projectId: ULIDString
    resourceMapNames: Record<string, CIDString>
    imageIndex: number
    totalImages: number
  }
): ItemContext {
  return {
    // Readonly inputs
    jobId: request.taskId,
    buffer,
    canvas,
    metadata: {
      width: request.paintResolution.width,  // Extract from resolution
      height: request.paintResolution.height,
      seedPrefix: request.paintableSeed.prefix,
      seedSuffix: request.paintableSeed.suffix,
      regionMapCID: request.plotDataRef.cid,  // Extract from PlotDataRef
    },
    filenameExpression: request.paintingDomain.filenameExpression,  // If domain provides it
    executionStrategy: "WorkerPool",  // Or derive from request
    collection: collection ? {
      imageIndex: collection.imageIndex,
      totalImages: collection.totalImages,
      regionMapNames: collection.resourceMapNames,  // KEY MAPPING!
      regionMapName: findRegionName(request.plotDataRef.cid, collection.resourceMapNames),
    } : undefined,

    // Mutable state (initial values)
    disposition: JobDisposition.OK,
    error: undefined,
    actualFilename: undefined,
    customData: request.paintingDomain,  // Domain model becomes customData
    retry: {
      attemptNumber: 1,
      maxAttempts: 3,  // From configuration
    },
  }
}
```

### 2. ItemContext → TaskResultRecord Mapping

**Create adapter function**:
```typescript
function createTaskResultFromContext(
  ctx: ItemContext,
  originalIndex: number,
): TaskResultRecord {
  return {
    originalIndex,
    outcomeType: dispositionToOutcomeType(ctx.disposition),
    reportIfCompleted: ctx.disposition === JobDisposition.OK ? {
      groupPositions: ctx.customData?.groupPositions ?? {},
      wasStaged: !!ctx.customData?.s3Uri || !!ctx.customData?.localPath,
      locationIfStaged: createStagedPaths(ctx),
      wasCached: determineCacheKeyType(ctx),
    } : undefined,
    errorIfFailed: ctx.error?.message,
  }
}

function dispositionToOutcomeType(disposition: JobDisposition): OutcomeType {
  switch (disposition) {
    case JobDisposition.OK:
      return OutcomeType.OK
    case JobDisposition.IGNORE:
      return OutcomeType.IGNORED
    case JobDisposition.SEMANTIC_ERROR:
      return OutcomeType.SEMANTIC_ERROR
    case JobDisposition.FATAL_ERROR:
    case JobDisposition.TRANSIENT_ERROR:  // After retries exhausted
      return OutcomeType.FATAL_ERROR
    case JobDisposition.OUT_OF_RETRIES:
      return OutcomeType.OUT_OF_RETRIES
  }
}

function createStagedPaths(ctx: ItemContext): StagedTaskPaths | undefined {
  const primaryPath = ctx.customData?.s3Uri || ctx.customData?.localPath
  if (!primaryPath) return undefined

  return {
    primaryPath,
    hardLinks: ctx.customData?.hardLinks,
    extraCopies: ctx.customData?.extraCopies,
  }
}

function determineCacheKeyType(ctx: ItemContext): CacheKeyType {
  if (ctx.customData?.wasCached === true) {
    // Check what key was used for cache hit
    if (ctx.customData?.cacheKey === ctx.customData?.s3Uri) {
      return CacheKeyType.PRIMARY_STAGING_PATH
    }
    if (ctx.customData?.cacheKey === ctx.jobId) {
      return CacheKeyType.TASK_ULID
    }
  }
  return CacheKeyType.NOT_CACHED
}
```

### 3. Extended ItemContext for Partial Canvases

**Option A: Add optional fragment field**:
```typescript
export interface ItemContextInput {
  // ... existing fields ...

  /**
   * Optional canvas fragment specification.
   * When present, this task renders only a portion of the full canvas.
   */
  readonly canvasFragment?: CanvasFragment
}
```

**Option B: Separate context type**:
```typescript
export interface PartialItemContext extends ItemContext {
  readonly canvasFragment: CanvasFragment
}
```

**Recommendation**: Option A (optional field) is more flexible and doesn't require separate handler types.

### 4. Collection Context from MultiTaskRequestModel

```typescript
function createCollectionContextFromProject<T>(
  project: MultiTaskRequestModel<any, any>,
  childResults: Record<string, ItemContext>,
  collectionResult: CollectionResult<T>,
): CollectionContext<T> {
  return {
    // Readonly inputs
    jobId: project.projectId,
    collectionResult,
    executionStrategy: "WorkerPool",  // Or derive
    regionMapNames: project.resourceMapNames,

    // Mutable state
    disposition: JobDisposition.OK,
    error: undefined,
    customData: project.projectDomain,  // Project domain becomes customData
    retry: {
      attemptNumber: 1,
      maxAttempts: 3,
    },
  }
}
```

## LRU Cache Strategy for Task Outcome Caching

### Use Case

When a task with identical inputs (seed + spatial boundary + resolution + plot data) is submitted:
1. Check cache for previous result
2. If hit and still valid, return cached outcome immediately
3. If miss, render and cache the result

### Cache Key Strategies (per CacheKeyType enum)

**PRIMARY_STAGING_PATH** - Cache by final storage location:
```typescript
// Key: Hash of primaryPath (e.g., S3 URI or local path)
// Pro: Natural deduplication by content hash
// Con: Requires knowing final path before rendering
cacheKey = crypto.createHash('sha256')
  .update(s3Uri || localPath)
  .digest('hex')
```

**TASK_ULID** - Cache by task ID:
```typescript
// Key: taskId directly
// Pro: Simple, stable identifier
// Con: Same logical task with different ULID = cache miss
cacheKey = taskId
```

**Content-based (recommended)** - Cache by input parameters:
```typescript
// Key: Hash of (seed + boundary + resolution + plotDataRef)
// Pro: True deduplication - same inputs = cache hit regardless of taskId
// Con: Requires deterministic serialization
cacheKey = crypto.createHash('sha256')
  .update(request.paintableSeed.prefix)
  .update(request.paintableSeed.suffix)
  .update(JSON.stringify(request.spatialBoundary))
  .update(JSON.stringify(request.paintResolution))
  .update(request.plotDataRef.cid)
  .digest('hex')
```

### LRU Cache Implementation

**Create cache service**:
```typescript
// src/painting/cache/TaskOutcomeCache.ts

import { Injectable, Logger } from "@nestjs/common"
import { LRUCache } from "lru-cache"
import { TaskResultRecord } from "../messages/values/TaskResultRecord.js"
import { SinglePaintingTaskRequest } from "../messages/dto/SinglePaintingTaskRequest.js"
import * as crypto from "crypto"

export interface CachedTaskOutcome {
  /**
   * The task result to return
   */
  result: TaskResultRecord

  /**
   * When this cache entry was created
   */
  cachedAt: Date

  /**
   * TTL for this entry (in ms)
   */
  ttl?: number

  /**
   * Original request that produced this result (for validation)
   */
  request: SinglePaintingTaskRequest<any>
}

export interface TaskOutcomeCacheOptions {
  /**
   * Maximum number of cached outcomes
   */
  maxEntries?: number

  /**
   * Maximum size in bytes (approximate - based on JSON.stringify)
   */
  maxSizeBytes?: number

  /**
   * Default TTL in milliseconds (undefined = no expiration)
   */
  defaultTtl?: number

  /**
   * Cache key strategy
   */
  keyStrategy?: "taskId" | "contentHash" | "primaryPath"
}

@Injectable()
export class TaskOutcomeCache {
  private readonly logger = new Logger(TaskOutcomeCache.name)
  private readonly cache: LRUCache<string, CachedTaskOutcome>
  private readonly keyStrategy: "taskId" | "contentHash" | "primaryPath"

  constructor(options: TaskOutcomeCacheOptions = {}) {
    this.keyStrategy = options.keyStrategy ?? "contentHash"

    this.cache = new LRUCache<string, CachedTaskOutcome>({
      max: options.maxEntries ?? 1000,
      maxSize: options.maxSizeBytes ?? 10 * 1024 * 1024, // 10MB default
      ttl: options.defaultTtl,  // undefined = no expiration

      // Calculate size of each entry
      sizeCalculation: (value) => {
        return JSON.stringify(value).length
      },

      // Log evictions
      dispose: (value, key, reason) => {
        if (reason === "evict") {
          this.logger.debug(`Cache evicted: ${key} (reason: ${reason})`)
        }
      },
    })

    this.logger.log(
      `TaskOutcomeCache initialized with strategy=${this.keyStrategy}, ` +
      `maxEntries=${options.maxEntries ?? 1000}, ` +
      `maxSize=${(options.maxSizeBytes ?? 10*1024*1024) / 1024 / 1024}MB`
    )
  }

  /**
   * Generate cache key for a task request
   */
  private generateKey(request: SinglePaintingTaskRequest<any>): string {
    switch (this.keyStrategy) {
      case "taskId":
        return request.taskId

      case "contentHash":
        // Hash of all input parameters
        const hash = crypto.createHash("sha256")
        hash.update(request.paintableSeed.prefix)
        hash.update(request.paintableSeed.suffix)
        hash.update(JSON.stringify(request.spatialBoundary))
        hash.update(JSON.stringify(request.paintResolution))
        hash.update(request.plotDataRef.toString())  // Assuming PlotDataRef has CID

        // Include canvas fragment if partial render
        if ("partialSlice" in request) {
          hash.update(JSON.stringify((request as any).partialSlice))
        }

        return hash.digest("hex")

      case "primaryPath":
        // This requires the result to exist, so it's used during set(), not get()
        throw new Error("primaryPath strategy requires result - use during set()")
    }
  }

  /**
   * Check cache for a matching task outcome
   */
  get(request: SinglePaintingTaskRequest<any>): CachedTaskOutcome | undefined {
    if (this.keyStrategy === "primaryPath") {
      // Can't use primaryPath strategy for get - we don't have the result yet
      return undefined
    }

    const key = this.generateKey(request)
    const cached = this.cache.get(key)

    if (cached) {
      this.logger.debug(`Cache HIT for key: ${key.slice(0, 16)}...`)

      // Validate that request hasn't changed in incompatible ways
      if (!this.validateCachedRequest(request, cached.request)) {
        this.logger.warn(`Cache entry invalid - request changed: ${key.slice(0, 16)}...`)
        this.cache.delete(key)
        return undefined
      }
    } else {
      this.logger.debug(`Cache MISS for key: ${key.slice(0, 16)}...`)
    }

    return cached
  }

  /**
   * Store a task outcome in cache
   */
  set(
    request: SinglePaintingTaskRequest<any>,
    result: TaskResultRecord,
    primaryPath?: string,
    ttl?: number,
  ): void {
    let key: string

    if (this.keyStrategy === "primaryPath") {
      if (!primaryPath) {
        this.logger.warn("Cannot cache with primaryPath strategy - no path provided")
        return
      }
      key = crypto.createHash("sha256").update(primaryPath).digest("hex")
    } else {
      key = this.generateKey(request)
    }

    const entry: CachedTaskOutcome = {
      result,
      request,
      cachedAt: new Date(),
      ttl,
    }

    this.cache.set(key, entry, { ttl })
    this.logger.debug(`Cached task outcome: ${key.slice(0, 16)}...`)
  }

  /**
   * Validate that cached request is compatible with new request
   */
  private validateCachedRequest(
    newReq: SinglePaintingTaskRequest<any>,
    cachedReq: SinglePaintingTaskRequest<any>,
  ): boolean {
    // For contentHash strategy, these should always match since they're part of the key
    // But validate anyway for safety
    return (
      newReq.paintableSeed.prefix === cachedReq.paintableSeed.prefix &&
      newReq.paintableSeed.suffix === cachedReq.paintableSeed.suffix &&
      JSON.stringify(newReq.spatialBoundary) === JSON.stringify(cachedReq.spatialBoundary) &&
      JSON.stringify(newReq.paintResolution) === JSON.stringify(cachedReq.paintResolution) &&
      newReq.plotDataRef.toString() === cachedReq.plotDataRef.toString()
    )
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
    this.logger.log("Cache cleared")
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.cache.max,
      calculatedSize: this.cache.calculatedSize,
    }
  }
}
```

### Integration with Middleware

**Add cache check middleware**:
```typescript
// src/painting/middleware/handlers/CachedOutcomeCheckMiddleware.ts

export class CachedOutcomeCheckMiddleware implements MiddlewareHandler<ItemContext> {
  constructor(
    _params: { enableCache: boolean },
    private readonly logger: Logger,
    private readonly outcomeCache: TaskOutcomeCache,
  ) {}

  async handle(ctx: ItemContext): Promise<ItemContext> {
    // Reconstruct request from context (or pass it through customData)
    const request = ctx.customData?.originalRequest as SinglePaintingTaskRequest<any>
    if (!request) {
      this.logger.warn("No original request in customData - skipping cache check")
      return ctx
    }

    const cached = this.outcomeCache.get(request)
    if (!cached) {
      // Cache miss - proceed with rendering
      return ctx
    }

    // Cache hit - return cached outcome immediately
    this.logger.log(`Using cached outcome for task ${ctx.jobId}`)

    return {
      ...ctx,
      disposition: outcomeTypeToDisposition(cached.result.outcomeType),
      actualFilename: cached.result.reportIfCompleted?.locationIfStaged?.primaryPath,
      customData: {
        ...ctx.customData,
        wasCached: true,
        cacheKey: request.taskId,
        cachedAt: cached.cachedAt,
        // Copy staged locations from cache
        s3Uri: cached.result.reportIfCompleted?.locationIfStaged?.primaryPath,
        groupPositions: cached.result.reportIfCompleted?.groupPositions,
      },
    }
  }
}
```

**Add cache write middleware** (at end of chain):
```typescript
// src/painting/middleware/handlers/CachedOutcomeWriteMiddleware.ts

export class CachedOutcomeWriteMiddleware implements MiddlewareHandler<ItemContext> {
  constructor(
    _params: { enableCache: boolean; ttl?: number },
    private readonly logger: Logger,
    private readonly outcomeCache: TaskOutcomeCache,
  ) {}

  async handle(ctx: ItemContext): Promise<ItemContext> {
    // Only cache successful outcomes (or configure which dispositions to cache)
    if (ctx.disposition !== JobDisposition.OK) {
      return ctx
    }

    const request = ctx.customData?.originalRequest as SinglePaintingTaskRequest<any>
    if (!request) {
      return ctx
    }

    const result: TaskResultRecord = createTaskResultFromContext(ctx, ctx.collection?.imageIndex ?? 0)
    const primaryPath = ctx.customData?.s3Uri || ctx.customData?.localPath

    this.outcomeCache.set(request, result, primaryPath, this.params.ttl)

    return {
      ...ctx,
      customData: {
        ...ctx.customData,
        wasCached: false,  // Newly cached, not a cache hit
      },
    }
  }
}
```

## Recommended Implementation Order

1. **Create adapter functions** (`DTO → ItemContext`, `ItemContext → TaskResultRecord`)
2. **Implement TaskOutcomeCache** service with LRU cache
3. **Add cache middleware** (check at start, write at end of chain)
4. **Wire up DI** - provide cache instance to middleware
5. **Update workers** to use adapters when creating contexts from DTOs
6. **Test with real queue jobs** to verify caching behavior

## Open Questions

1. **Which cache key strategy?**
   - Recommend `contentHash` for true deduplication
   - But `taskId` is simpler if tasks are already deduplicated upstream

2. **Cache TTL?**
   - How long are outcomes valid? (seconds, minutes, hours?)
   - Should different outcome types have different TTLs?

3. **Partial canvas caching?**
   - Should partial renders be cached separately?
   - Or only cache full canvas results?

4. **Domain model integration?**
   - How should `PaintingDomain` / `ProjectDomain` generics be typed?
   - What fields do they actually contain?
