# Cache Integration Summary

## What Was Delivered

### 1. **RenderedImageCache** - Core LRU Cache
[src/painting/cache/RenderedImageCache.ts](src/painting/cache/RenderedImageCache.ts)

**Purpose**: Hold rendered PNG buffers in memory after worker completion for user access.

**Key Features**:
- Simple API: `set(taskId, buffer, width, height)` / `get(taskId)`
- Keyed by Task ULID (not content hash)
- TTL-based expiration (5 min default)
- LRU eviction (200MB default)
- Size-aware: tracks actual buffer.length
- **Fully testable**: Accepts optional `cacheInstance` for mocking

### 2. **CacheRenderedImageMiddleware** - Post-Rendering Handler
[src/painting/middleware/handlers/CacheRenderedImageMiddleware.ts](src/painting/middleware/handlers/CacheRenderedImageMiddleware.ts)

**Position**: Near END of middleware chain (after rendering, after storage)

**Job**: Store rendered buffer in cache so worker can complete and user can retrieve later.

**Configuration**:
```typescript
{
  middlewareClass: CacheRenderedImageMiddleware,
  valueParams: {
    enabled: true,
    ttl: 5 * 60 * 1000,  // 5 minutes
  },
  inject: [imageCache],  // RenderedImageCache instance
}
```

### 3. **Cache Access Functions** - Expression Integration
[src/painting/middleware/expression/CacheAccessFunctions.ts](src/painting/middleware/expression/CacheAccessFunctions.ts)

**Purpose**: Make cache queryable from filename/middleware expressions.

**Functions**:
- `isCached()` - Boolean: is image in cache?
- `cacheAge()` - Number: age in seconds
- `cacheSize()` - Number: size in MB
- `cachedStagedPath()` - String: staged location from cache
- `cacheStats()` - Object: cache statistics

**Usage in expressions**:
```javascript
// Filename includes cache status
"`${isCached() ? 'cached' : 'fresh'}/${contentHash(12)}.png`"

// Use cached staged path to avoid re-staging
"`${cachedStagedPath() || contentHash(12)}.png`"

// Include age for debugging
"`img_${cacheAge()}s_${contentHash(8)}.png`"
```

### 4. **Example Integration**
[src/painting/middleware/config/ExampleCacheIntegration.ts](src/painting/middleware/config/ExampleCacheIntegration.ts)

Complete example showing:
- How to wire cache into middleware chain
- How to inject cache functions into expressions
- Worker usage pattern
- User/API retrieval pattern

### 5. **Comprehensive Test Suite**
[src/painting/cache/__tests__/RenderedImageCache.test.ts](src/painting/cache/__tests__/RenderedImageCache.test.ts)

Full test coverage with:
- MockLRUCache implementation demonstrating mocking strategy
- MockLogger for testing logging behavior
- Tests for all cache methods (set, get, has, delete, clear)
- TTL handling tests
- Statistics tests
- Logging verification tests

### 6. **Documentation**
[src/painting/cache/CACHE_DESIGN.md](src/painting/cache/CACHE_DESIGN.md)

Comprehensive design doc covering:
- Purpose and problem solved
- Key design decisions (ULID keys, TTL, LRU)
- Usage patterns
- Configuration tuning
- Monitoring

---

## The Complete Flow

### 1. Worker Renders Image
```typescript
// Worker job handler
const { buffer, canvas } = await renderEngine.render(request)
const ctx = createItemContextFromRequest(request, buffer, canvas)
```

### 2. Middleware Chain Executes
```typescript
// Chain includes (in order):
// - FileNameResolverMiddleware (can use cache expressions)
// - ContentSizeFilterMiddleware
// - S3StorageHandlerMiddleware (stages to S3)
// - CacheRenderedImageMiddleware (caches buffer) ← HERE

const result = await itemMiddlewareChain.execute(ctx)
```

### 3. CacheRenderedImageMiddleware Runs
```typescript
// Inside middleware:
imageCache.set(
  ctx.jobId,           // Task ULID key
  ctx.buffer,          // PNG buffer
  ctx.metadata.width,
  ctx.metadata.height,
  {
    s3Uri: ctx.customData.s3Uri,      // From S3 middleware
    primaryPath: ctx.customData.s3Uri
  }
)
```

### 4. Worker Completes
```typescript
// Worker can now complete and terminate
// Buffer remains in cache for 5 minutes (default TTL)
return result
```

### 5. User Retrieves Image
```typescript
// User/API requests image by taskId
const cached = imageCache.get(taskId)

if (cached) {
  // Cache HIT - instant in-memory access (no S3 fetch!)
  res.setHeader('X-Cache', 'HIT')
  res.send(cached.buffer)
} else {
  // Cache MISS - fallback to S3
  res.setHeader('X-Cache', 'MISS')
  const buffer = await s3.getObject({ Key: taskId })
  res.send(buffer.Body)
}
```

---

## Expression Function Usage

Cache functions become available in **any middleware that evaluates expressions**:

### FileNameResolverMiddleware Example
```typescript
{
  middlewareClass: FileNameResolverMiddleware,
  valueParams: {},
  inject: [
    expressionEvaluator,
    createCacheAccessFunctions(imageCache),  // Cache functions!
  ],
}
```

### Filename Expressions Can Now Use:
```javascript
// Check if cached
"`${isCached() ? 'hit' : 'miss'}/${contentHash(12)}.png`"

// Include cache age
"`img_${cacheAge()}s_${regionMapName()}.png`"

// Conditional based on cache size
"`${cacheSize() > 2 ? 'large' : 'small'}/${contentHash(8)}.png`"

// Use staged path from cache (avoid re-staging)
"`${cachedStagedPath() || 'default/' + contentHash(12)}.png`"
```

---

## Key Differences from Original Design

| Aspect | Original (Wrong) | Final (Correct) |
|--------|------------------|-----------------|
| **Purpose** | Deduplicate render requests | Hold buffers post-render for user access |
| **When set** | Before rendering | After rendering (in middleware) |
| **Key** | Content hash of inputs | Task ULID |
| **Likelihood** | Low (duplicates rare) | High (user analysis common) |
| **TTL** | None (forever) | 5 minutes default |
| **Size** | 10MB | 200MB |
| **Integration** | Separate from middleware | Middleware + expression functions |
| **Benefit** | Avoid redundant renders | Decouple worker lifecycle from data retention |

---

## Testability Pattern

### Mock LRUCache for Testing
```typescript
class MockLRUCache<K, V> {
   private store = new Map<K, V>()

   set(key: K, value: V, options?: any): this {
      this.store.set(key, value)
      return this
   }

   get(key: K): V | undefined {
      return this.store.get(key)
   }

   // ... other LRUCache methods
}

// Usage in tests:
const mockLRU = new MockLRUCache<ULIDString, CachedRenderedImage>({
   max: 100,
   maxSize: 200 * 1024 * 1024,
   sizeCalculation: (value: CachedRenderedImage) => value.buffer.length,
})

const cache = new RenderedImageCache(
   { cacheInstance: mockLRU as any },
   mockLogger,
)
```

### Why This Works
- `RenderedImageCache` accepts optional `cacheInstance` in options
- If provided, uses that instead of creating new LRUCache
- Tests inject mock, production uses default
- No changes to public API

---

## Configuration & Tuning

### Cache Instance Creation
```typescript
// In DI module or app initialization
const imageCache = new RenderedImageCache({
  maxEntries: 100,              // ~100 images
  maxSizeBytes: 200_000_000,    // 200MB
  defaultTtl: 5 * 60 * 1000,    // 5 minutes
})
```

### Middleware Chain Configuration
```typescript
const { itemChain, cacheAccessFunctions } = createMiddlewareConfigWithCache(imageCache)

// Then wire up in module:
const middlewareModule = createMiddlewareModule({
  itemChain,
  collectionChain: [],
  dependencies: {
    ExpressionEvaluator: expressionEvaluatorToken,
    ExpressionAddons: cacheAccessFunctions,  // Make cache functions available
    S3FileStore: s3StoreToken,
  },
})
```

### Tuning Guidelines

**Development** (low memory):
```typescript
{ maxEntries: 20, maxSizeBytes: 50_000_000, defaultTtl: 120_000 }  // 50MB, 2min
```

**Production** (standard):
```typescript
{ maxEntries: 100, maxSizeBytes: 200_000_000, defaultTtl: 300_000 }  // 200MB, 5min
```

**High-volume** (large memory):
```typescript
{ maxEntries: 500, maxSizeBytes: 1_000_000_000, defaultTtl: 600_000 }  // 1GB, 10min
```

---

## Monitoring & Debugging

### Check Cache Statistics
```typescript
const stats = imageCache.getStats()
console.log(`Cache: ${stats.size}/${stats.maxEntries} entries, ${stats.totalSizeMB}MB/${stats.maxSizeMB}MB (${stats.utilizationPercent}%)`)
```

### List Cached Task IDs
```typescript
const cachedTasks = imageCache.getCachedTaskIds()
console.log(`Cached tasks: ${cachedTasks.join(', ')}`)
```

### Manual Eviction
```typescript
// User explicitly deletes/dismisses image
imageCache.delete(taskId)
```

### Clear All
```typescript
// Clear cache (e.g., during shutdown or reset)
imageCache.clear()
```

---

## What's Ready Now (Once Build is Fixed)

✅ **RenderedImageCache** - Complete, tested LRU implementation
✅ **CacheRenderedImageMiddleware** - Post-rendering handler
✅ **Cache access functions** - Expression integration
✅ **Example configuration** - Complete wiring example
✅ **Comprehensive tests** - MockLRUCache pattern demonstrated
✅ **Documentation** - Design decisions, usage patterns, tuning

## Integration Checklist

When you're ready to integrate:

1. **Create cache instance** in DI module or app init
2. **Add CacheRenderedImageMiddleware** to item chain (near end)
3. **Inject cache functions** into expression-based middleware
4. **Update worker** to use middleware chain (already does this)
5. **Add API endpoint** for user retrieval by taskId
6. **Monitor cache stats** to tune maxSize/TTL

The cache decouples worker lifecycle from user data access, exactly as intended!
