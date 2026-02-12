# V3 Architecture Summary

## The Complete Solution

V3 combines **TypeScript's native declaration merging** with **Symbol properties** to create a middleware system that is:

1. **Framework-free** - Extensions work independently
2. **Serialization-safe** - Clean payloads for remote workers
3. **Type-safe** - Full TypeScript support
4. **Testable** - No mocks or harness needed
5. **Simple** - ~50 lines of infrastructure vs ~600 in V2

## Three Key Innovations

### 1. Declaration Merging (Extensions)

```typescript
// Extension augments base class via TypeScript's native feature
import { PipelineContext } from "./PipelineContext"

declare module "./PipelineContext" {
   interface PipelineContext {
      campaignId: string
      getCampaignKey(): string
   }
}

PipelineContext.prototype.getCampaignKey = function() {
   return `campaign:${this.campaignId}`
}
```

**Benefit**: No framework needed. Extensions are plain TypeScript.

### 2. Symbol Properties (Non-Serializable State)

```typescript
const CONTENT_HASH_CACHE = Symbol("contentHashCache")

PipelineContext.prototype.getContentHash = function() {
   const self = this as any
   if (self[CONTENT_HASH_CACHE] === undefined) {
      self[CONTENT_HASH_CACHE] = computeHash(this.buffer)
   }
   return self[CONTENT_HASH_CACHE]
}
```

**Benefit**: Caches and dependencies don't serialize. Clean payloads.

### 3. Prototype Methods (Behavior)

```typescript
// Methods live on prototype, not instances
PipelineContext.prototype.getFullPath = function() {
   return `${this.getStorageKey()}/${this.fileName}`
}
```

**Benefit**: Methods don't serialize. Only data crosses boundaries.

## State Classification

| State Type | Example | Storage | Serialized? |
|------------|---------|---------|-------------|
| **Model Data** | `jobId`, `campaignId`, `buffer` | Instance property | ✓ Yes |
| **Behavior** | `getCampaignKey()`, `getFullPath()` | Prototype method | ✗ No |
| **Cache** | Computed hash, analysis results | Symbol property | ✗ No |
| **Dependencies** | FileStore, GraphDB | Symbol property | ✗ No |

## File Structure

```
v3/
├── PipelineContext.ts              # Base class (framework properties)
├── PipelineExecutor.ts             # Trivial executor (~30 lines)
├── extensions/
│   ├── index.ts                    # Barrel (import order = dependencies)
│   ├── symbols.ts                  # Symbol definitions
│   ├── campaign.ts                 # Campaign extension
│   ├── storage.ts                  # Storage (depends on campaign)
│   ├── naming.ts                   # Naming (depends on storage)
│   ├── contentHash.ts              # Hash with memoization (Symbol cache)
│   └── fileStorage.ts              # FileStore with injection (Symbol dep)
├── __tests__/
│   ├── PipelineContext.test.ts     # 8 tests - basic functionality
│   └── serialization.test.ts       # 5 tests - serialization behavior
├── example.ts                      # Runnable demo
├── README.md                       # Quick start
├── V3_ARCHITECTURE.md              # Complete architecture
├── COMPARISON.md                   # V1 → V2 → V3 evolution
├── SERIALIZATION.md                # Symbol properties explained
└── SUMMARY.md                      # This file
```

## Complete Example

### Define Extensions

```typescript
// campaign.ts
declare module "./PipelineContext" {
   interface PipelineContext {
      campaignId: string
      getCampaignKey(): string
   }
}

PipelineContext.prototype.getCampaignKey = function() {
   return `campaign:${this.campaignId}`
}
```

### Use with Memoization

```typescript
// contentHash.ts
const CONTENT_HASH_CACHE = Symbol("cache")

declare module "./PipelineContext" {
   interface PipelineContext {
      getContentHash(): string
   }
}

PipelineContext.prototype.getContentHash = function() {
   const self = this as any
   if (self[CONTENT_HASH_CACHE] === undefined) {
      self[CONTENT_HASH_CACHE] = crypto.hash(this.buffer)
   }
   return self[CONTENT_HASH_CACHE]
}
```

### Inject Dependencies

```typescript
// fileStorage.ts
const FILE_STORE = Symbol("fileStore")

export function injectFileStore(ctx: PipelineContext, store: IFileStore): void {
   (ctx as any)[FILE_STORE] = store
}

PipelineContext.prototype.writeToStorage = async function() {
   const store = (this as any)[FILE_STORE]
   await store.write(this.getFullPath(), this.buffer)
}
```

### Execute Pipeline

```typescript
import { PipelineContext } from "./PipelineContext"
import { injectFileStore } from "./extensions"

const ctx = new PipelineContext()
ctx.jobId = "job-123"
ctx.buffer = imageBuffer

// Populate in dependency order
populateCampaign(ctx)
populateStorage(ctx)
populateNaming(ctx)

// Inject services
injectFileStore(ctx, s3Store)

// Use methods (all available via prototype)
console.log(ctx.getCampaignKey())
console.log(ctx.getFullPath())
await ctx.writeToStorage()
```

### Serialize for Remote Worker

```typescript
// Main process
const ctx = new PipelineContext()
ctx.jobId = "job-123"
ctx.buffer = imageBuffer
ctx.campaignId = "camp-abc"

ctx.getContentHash()  // Populates cache (Symbol)
injectFileStore(ctx, s3Store)  // Injects dependency (Symbol)

// Send to worker
const payload = JSON.stringify(ctx)
// Only jobId, buffer, campaignId serialize
// Cache and FileStore do NOT serialize

// Worker receives
const data = JSON.parse(payload)
const workerCtx = new PipelineContext()
Object.assign(workerCtx, data)
workerCtx.buffer = Buffer.from(data.buffer.data)

// Methods work (from prototype)
workerCtx.getCampaignKey()  // ✓ Works

// Cache was not transferred (will recompute)
workerCtx.getContentHash()  // Fresh computation

// Dependency not transferred (re-inject if needed)
injectFileStore(workerCtx, workerStore)
```

## Test Results

```
✓ Campaign Extension - should provide campaign methods
✓ Storage Extension - should build storage paths using campaign
✓ Naming Extension - should build full paths using storage
✓ Content Hash Extension - should compute content hash
✓ Content Hash Extension - should memoize hash computation
✓ Content Hash Extension - should derive prefix and suffix from cached hash
✓ Full Pipeline Integration - should work with all extensions together
✓ Development Flow - allows discovering dependencies naturally
✓ Serialization - should serialize model data but not caches
✓ Serialization - should not serialize injected dependencies
✓ Serialization - should not serialize methods
✓ Remote Worker Scenario - should send only model data to remote worker
✓ What Gets Serialized - should serialize only enumerable own properties

Test Suites: 2 passed, 2 total
Tests:       13 passed, 13 total
```

## Key Principles

1. **Extensions exist naturally** - Framework orchestrates, doesn't create
2. **Model data serializes** - Implementation details don't
3. **Import order = dependency order** - TypeScript validates
4. **Methods on prototype** - Shared behavior, not serialized
5. **Symbol for non-serializable** - Caches and dependencies
6. **Test without framework** - Direct instantiation works

## Migration from V2

### Before (V2)
```typescript
class _Campaign implements ICampaign {
   constructor(private readonly base: BaseModel) {}
   campaignId = ""
   getCampaignKey() {
      return `campaign:${this.campaignId}`
   }
}

const CampaignExt = defineExtensionV2(
   BaseModel, _Campaign, ["base"], [BaseModel], exemplar
)
```

### After (V3)
```typescript
declare module "./PipelineContext" {
   interface PipelineContext {
      campaignId: string
      getCampaignKey(): string
   }
}

PipelineContext.prototype.getCampaignKey = function() {
   return `campaign:${this.campaignId}`
}
```

**Simpler. Native. No framework.**

## The Core Insight

V1 and V2 tried to solve problems that **TypeScript already solved**:

- ✓ Type safety → Declaration merging
- ✓ Dependency validation → Import order
- ✓ Composition → Prototype methods
- ✓ Non-serializable state → Symbol properties

We don't need to build infrastructure when the language provides the tools.

## Resources

- [V3_ARCHITECTURE.md](./V3_ARCHITECTURE.md) - Complete technical documentation
- [COMPARISON.md](./COMPARISON.md) - Evolution from V1 through V3
- [SERIALIZATION.md](./SERIALIZATION.md) - Symbol properties in depth
- [example.ts](./example.ts) - Working demonstration
- [TypeScript Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
- [MDN Symbol Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
