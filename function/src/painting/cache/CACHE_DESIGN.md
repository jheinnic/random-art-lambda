# Rendered Image Cache Design

## Purpose

**Decouple BullMQ worker lifecycle from image data retention.**

### The Problem

When a BullMQ worker completes a rendering job:
1. Worker renders the image → produces PNG Buffer
2. Worker may stage to S3/local storage
3. Worker completes the job and terminates
4. **Buffer is lost** - worker memory is released

If the user wants to retrieve/analyze the image after completion:
- Must fetch from S3 (latency, cost)
- Must fetch from local storage (I/O overhead)
- No in-memory access to recently rendered data

### The Solution

**RenderedImageCache** - LRU cache holding PNG buffers by taskId:

```typescript
// Worker after rendering:
cache.set(taskId, buffer, width, height, stagedLocation)
// Worker completes and terminates

// Later - user requests image:
const cached = cache.get(taskId)
if (cached) {
  // Instant in-memory access!
  return cached.buffer
} else {
  // Fall back to S3/local storage
  return await s3.get(stagedLocation.s3Uri)
}
```

## Key Design Decisions

### 1. Cache by Task ULID (not content hash)

**Why**: Each task produces a unique render to cache temporarily.

- **NOT** for deduplication (duplicate requests are unlikely)
- **FOR** holding recently completed renders in memory
- Each task has exactly one buffer to cache
- Simple 1:1 mapping: `taskId → buffer`

### 2. TTL-based Expiration (default 5 minutes)

**Why**: Reasonable window for user analysis, automatic cleanup.

- User typically analyzes within minutes of job completion
- After 5 minutes, likely already retrieved or no longer needed
- Prevents indefinite memory growth
- Can be overridden per-task if needed

### 3. Size-based LRU Eviction (default 200MB)

**Why**: Prevent unbounded memory usage.

- ~100-200 images in memory (assuming ~1-2MB each)
- LRU evicts oldest/least-recently-used when limit reached
- Tracks actual `buffer.length` for accurate size accounting

### 4. updateAgeOnGet: false

**Why**: Read-only access shouldn't affect eviction order.

- User retrieving image multiple times shouldn't extend its life
- LRU order based on when cached (set time), not access time
- More predictable behavior

## Usage Pattern

### Worker Side (Store)

```typescript
// After rendering completes
const { buffer, canvas } = await renderEngine.render(request)
const width = canvas.width
const height = canvas.height

// Store in S3/local
const s3Uri = await s3Store.write(filename, buffer)

// Cache in memory for user access
imageCache.set(taskId, buffer, width, height, {
  primaryPath: s3Uri,
  s3Uri,
})

// Worker can now complete and release resources
return { taskId, outcome: "OK", stagedAt: s3Uri }
```

### User/API Side (Retrieve)

```typescript
// User requests image by taskId
const cached = imageCache.get(taskId)

if (cached) {
  // Cache HIT - instant in-memory access
  return {
    buffer: cached.buffer,
    width: cached.width,
    height: cached.height,
    source: "cache",
  }
} else {
  // Cache MISS - fetch from storage
  const buffer = await fetchFromStorage(taskId)
  return {
    buffer,
    source: "storage",
  }
}
```

## Configuration

```typescript
const cache = new RenderedImageCache({
  maxEntries: 100,              // Max number of images
  maxSizeBytes: 200 * 1024 * 1024,  // 200MB total
  defaultTtl: 5 * 60 * 1000,    // 5 minutes
})
```

### Tuning Guidelines

**Small memory footprint** (development):
```typescript
{ maxEntries: 20, maxSizeBytes: 50_000_000, defaultTtl: 120_000 } // 50MB, 2min
```

**Large memory footprint** (production with heavy analysis):
```typescript
{ maxEntries: 500, maxSizeBytes: 1_000_000_000, defaultTtl: 600_000 } // 1GB, 10min
```

**High-churn scenario** (many quick renders):
```typescript
{ maxEntries: 200, maxSizeBytes: 300_000_000, defaultTtl: 180_000 } // 300MB, 3min
```

## Benefits

✅ **Fast user access** - No S3/storage fetch for recent images
✅ **Worker independence** - Workers complete immediately after storing
✅ **Automatic cleanup** - TTL + LRU prevent memory leaks
✅ **Graceful degradation** - Cache miss falls back to storage
✅ **Observable** - Debug logs for hits/misses/evictions
✅ **Configurable** - Tune memory vs retention tradeoff

## Monitoring

```typescript
const stats = cache.getStats()
console.log(stats)
// {
//   size: 47,                    // 47 images cached
//   maxEntries: 100,
//   totalSizeMB: "94.23",        // 94MB used
//   maxSizeMB: "200",            // 200MB limit
//   utilizationPercent: "47.1"   // 47% full
// }

const taskIds = cache.getCachedTaskIds()
// ["01HQ5K...", "01HQ5M...", ...]
```

## Integration with DTOs

The cache bridges the gap between worker completion and user access:

1. **Worker completes** → Returns `TaskResultRecord` (metadata only)
2. **Cache holds** → PNG buffer + dimensions
3. **User retrieves** → Gets buffer without storage fetch

**DTOs remain metadata-only** (no buffer data):
- `TaskResultRecord` - outcome, staged location, error
- `PartialPaintResult` - task metadata
- Buffers live in cache, accessed by taskId

## Differences from TaskOutcomeCache (deprecated)

| Aspect | TaskOutcomeCache (old) | RenderedImageCache (new) |
|--------|----------------------|--------------------------|
| **Purpose** | Deduplicate render requests | Hold buffers post-render |
| **Key** | Content hash of inputs | Task ULID |
| **When set** | Before rendering | After rendering |
| **Benefit** | Avoid duplicate renders | Fast user access |
| **Likelihood** | Low (duplicate requests rare) | High (user analysis common) |
| **TTL default** | None (forever) | 5 minutes |
| **Size default** | 10MB | 200MB |

## Future Enhancements

1. **Compression** - Compress buffers before caching (trade CPU for memory)
2. **Tiered eviction** - Move to disk-based cache before full eviction
3. **Partitioning** - Separate caches per user/project
4. **Warming** - Pre-load frequently accessed images
5. **Metrics** - Export hit rate, eviction rate to monitoring
