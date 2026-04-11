# Serialization Strategy - V3 Architecture

## Problem Statement

When sending context objects to remote workers or persisting to databases, we need to distinguish between three types of state:

1. **Model Data** - Serializable state about the image (jobId, campaignId, dimensions, etc.)
2. **Implementation Details** - Non-serializable caches and intermediate computations
3. **Injected Dependencies** - Non-serializable services (FileStore, DB repositories)

## Solution: Symbol Properties

JavaScript **Symbol properties** are perfect for non-serializable state:

```typescript
const CONTENT_HASH_CACHE = Symbol("contentHashCache")
const FILE_STORE = Symbol("fileStore")

// Set Symbol property
context[CONTENT_HASH_CACHE] = computedHash
context[FILE_STORE] = fileStoreInstance

// JSON.stringify ignores Symbol properties
JSON.stringify(context)  // ✓ Only includes regular properties
```

### Why Symbols?

- ✓ **Not enumerable** - Won't show up in `for...in` or `Object.keys()`
- ✓ **Not serialized** - `JSON.stringify()` ignores them
- ✓ **Type-safe** - Can import and use with TypeScript
- ✓ **No naming conflicts** - Symbols are unique

## Architecture

### 1. Define Symbols

```typescript
// symbols.ts
export const CONTENT_HASH_CACHE = Symbol("contentHashCache")
export const COLOR_ANALYSIS_CACHE = Symbol("colorAnalysisCache")
export const FILE_STORE = Symbol("fileStore")
export const GRAPH_DB = Symbol("graphDb")
```

### 2. Use in Extensions

#### Memoization Cache

```typescript
PipelineContext.prototype.getContentHash = function() {
   const self = this as any
   if (self[CONTENT_HASH_CACHE] === undefined) {
      const hash = createHash("sha256")
      hash.update(this.buffer)
      self[CONTENT_HASH_CACHE] = hash.digest("hex")
   }
   return self[CONTENT_HASH_CACHE] as string
}
```

#### Injected Dependencies

```typescript
export function injectFileStore(
   ctx: PipelineContext,
   fileStore: IFileStore,
): void {
   (ctx as any)[FILE_STORE] = fileStore
}

PipelineContext.prototype.writeToStorage = async function() {
   const self = this as any
   const fileStore = self[FILE_STORE] as IFileStore

   if (!fileStore) {
      throw new Error("FileStore not injected")
   }

   await fileStore.write(this.getFullPath(), this.buffer)
}
```

### 3. Serialization Behavior

```typescript
const ctx = new PipelineContext()
ctx.jobId = "job-123"
ctx.campaignId = "camp-abc"

// Trigger cache
ctx.getContentHash()

// Inject dependency
injectFileStore(ctx, fileStoreInstance)

// Serialize
const json = JSON.stringify(ctx)
const parsed = JSON.parse(json)

// ✓ Model data present
console.log(parsed.jobId)       // "job-123"
console.log(parsed.campaignId)  // "camp-abc"

// ✗ Cache NOT present (Symbol)
console.log(parsed[CONTENT_HASH_CACHE])  // undefined

// ✗ Dependency NOT present (Symbol)
console.log(parsed[FILE_STORE])  // undefined

// ✗ Methods NOT present (prototype)
console.log(parsed.getCampaignKey)  // undefined
```

## Remote Worker Pattern

### Main Process

```typescript
// Create and populate context
const ctx = new PipelineContext()
ctx.jobId = "job-123"
ctx.buffer = imageBuffer
ctx.campaignId = "camp-abc"

// Trigger computations (cache populated locally)
ctx.getContentHash()

// Inject services (not serializable)
injectFileStore(ctx, s3FileStore)

// Serialize for remote worker (only model data sent)
const payload = JSON.stringify(ctx)
await sendToWorker(payload)
```

### Remote Worker

```typescript
// Receive payload
const data = JSON.parse(payload)

// Recreate context
const ctx = new PipelineContext()
Object.assign(ctx, data)

// Reconstitute Buffer (special handling needed)
ctx.buffer = Buffer.from(data.buffer.data)

// Model data available
console.log(ctx.jobId)        // "job-123"
console.log(ctx.campaignId)   // "camp-abc"

// Methods work (from prototype)
console.log(ctx.getCampaignKey())  // "campaign:camp-abc"

// Cache not transferred - will recompute on first access
const hash = ctx.getContentHash()  // Fresh computation

// Dependencies not transferred - re-inject if needed
injectFileStore(ctx, workerFileStore)
await ctx.writeToStorage()  // Now works
```

## What Gets Serialized

| Type | Example | Serialized? |
|------|---------|------------|
| **Regular Properties** | `jobId`, `campaignId`, `buffer` | ✓ Yes |
| **Methods** | `getCampaignKey()`, `getFullPath()` | ✗ No (on prototype) |
| **Symbol Properties (Cache)** | `[CONTENT_HASH_CACHE]` | ✗ No (Symbol) |
| **Symbol Properties (Dependencies)** | `[FILE_STORE]`, `[GRAPH_DB]` | ✗ No (Symbol) |

## Benefits

### 1. Clean Serialization

Only model data crosses boundaries - no implementation details leak.

### 2. Safe Remote Execution

Remote workers get clean state without:
- Stale caches from main process
- Service instances that don't exist remotely
- Methods that might reference wrong environment

### 3. Re-injection Pattern

Services can be re-injected on remote side if needed:

```typescript
// Main process
injectFileStore(ctx, s3Store)

// Send to worker
const payload = JSON.stringify(ctx)

// Worker side
const ctx = deserialize(payload)
injectFileStore(ctx, workerLocalStore)  // Different implementation!
```

### 4. No Naming Conflicts

Symbols are unique - can't accidentally collide with model properties:

```typescript
// Safe - Symbol is unique
ctx[FILE_STORE] = fileStore

// Dangerous - could collide with model property
ctx.fileStore = fileStore  // What if model also has fileStore?
```

## Comparison: Regular Properties vs Symbols

### Regular Properties (OLD - Don't Use)

```typescript
// Implementation detail as regular property
PipelineContext.prototype.getContentHash = function() {
   if (!this._contentHashCache) {  // ⚠️ Will be serialized!
      this._contentHashCache = computeHash(this.buffer)
   }
   return this._contentHashCache
}

// Injected dependency as regular property
function injectFileStore(ctx, fileStore) {
   ctx.fileStore = fileStore  // ⚠️ Will be serialized (error!)
}

// Problems:
JSON.stringify(ctx)  // ✗ Includes _contentHashCache (wastes bandwidth)
                     // ✗ Includes fileStore (causes serialization errors)
```

### Symbol Properties (NEW - Use This)

```typescript
// Implementation detail as Symbol
const CACHE = Symbol("cache")
PipelineContext.prototype.getContentHash = function() {
   if (!this[CACHE]) {  // ✓ Won't be serialized
      this[CACHE] = computeHash(this.buffer)
   }
   return this[CACHE]
}

// Injected dependency as Symbol
const FILE_STORE = Symbol("fileStore")
function injectFileStore(ctx, fileStore) {
   ctx[FILE_STORE] = fileStore  // ✓ Won't be serialized
}

// Benefits:
JSON.stringify(ctx)  // ✓ Only model data
                     // ✓ No caches, no services
                     // ✓ Clean payload
```

## Testing Serialization

```typescript
describe("Serialization", () => {
   it("should exclude Symbol properties", () => {
      const ctx = new PipelineContext()
      ctx.jobId = "test"
      ctx.getContentHash()  // Populates cache

      const json = JSON.stringify(ctx)
      const parsed = JSON.parse(json)

      expect(parsed.jobId).toBe("test")  // ✓ Model data
      expect(parsed[CONTENT_HASH_CACHE]).toBeUndefined()  // ✓ Cache excluded
   })
})
```

## Key Principle

> **Model data is serializable. Implementation details and dependencies are not.**

Use Symbol properties to enforce this separation at the language level. The JavaScript runtime handles the rest.

## References

- [MDN: Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol)
- [JSON.stringify ignores Symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description)
- [V3 Serialization Tests](`./__tests__/serialization.test.ts`)
