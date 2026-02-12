# V3 Architecture - TypeScript Declaration Merging

## Overview

V3 uses **TypeScript's native declaration merging** to extend a base context class across multiple files. This eliminates framework lock-in and enables natural development flow.

## Core Principle

**Extensions exist naturally.** The framework merely orchestrates what already works.

## Key Insight from Observable Pattern

```typescript
// observable.ts - Base class
export class Observable<T> {
  // base implementation
}

// map.ts - Extension via declaration merging
import { Observable } from "./observable"

declare module "./observable" {
  interface Observable<T> {
    map<U>(f: (x: T) => U): Observable<U>
  }
}

Observable.prototype.map = function (f) {
  // implementation
}

// consumer.ts - Just works!
import { Observable } from "./observable"
import "./map"

let o: Observable<number>
o.map((x) => x.toFixed())  // ✓ TypeScript knows about map()
```

## Architecture Components

### 1. Base Context Class

```typescript
// PipelineContext.ts
export class PipelineContext {
   jobId = ""
   buffer = Buffer.from("")
}
```

Framework-owned properties only. Extensions augment this.

### 2. Extensions via Declaration Merging

```typescript
// extensions/campaign.ts
import { PipelineContext } from "../PipelineContext"

declare module "../PipelineContext" {
   interface PipelineContext {
      campaignId: string
      getCampaignKey(): string
   }
}

PipelineContext.prototype.getCampaignKey = function() {
   return `campaign:${this.campaignId}`
}

export function populateCampaign(ctx: PipelineContext): void {
   ctx.campaignId = `camp-${ctx.jobId.substring(0, 8)}`
}
```

Each extension:
- **Augments interface** via `declare module`
- **Adds methods to prototype** for shared behavior
- **Exports populate function** for data initialization

### 3. Extension Barrel (Dependency Order)

```typescript
// extensions/index.ts
import "./campaign"     // No dependencies
import "./contentHash"  // No dependencies
import "./storage"      // Depends on campaign
import "./naming"       // Depends on storage
```

**Import order = dependency order.** TypeScript validates this at compile time.

### 4. Pipeline Executor (Trivial)

```typescript
// PipelineExecutor.ts
import { PipelineContext } from "./PipelineContext"
import {
   populateCampaign,
   populateContentHash,
   populateStorage,
   populateNaming,
} from "./extensions/index"

export async function executePipeline(
   initialData: Partial<PipelineContext>,
): Promise<PipelineContext> {
   const ctx = new PipelineContext()
   Object.assign(ctx, initialData)

   // Populate in dependency order
   populateCampaign(ctx)
   populateContentHash(ctx)
   populateStorage(ctx)
   populateNaming(ctx)

   return ctx
}
```

The executor just calls populate functions in order. **Methods already exist on prototype.**

## Benefits Over V1/V2

### 1. No Framework Lock-in

```typescript
// Test without any framework
import { PipelineContext } from "./PipelineContext"
import "./extensions/index"

const ctx = new PipelineContext()
ctx.campaignId = "test"
ctx.getCampaignKey()  // ✓ Just works!
```

### 2. Natural Development Flow

```typescript
// Developer writes new extension
declare module "../PipelineContext" {
   interface PipelineContext {
      colorStats: ColorStats
      analyzeColors(): void
   }
}

PipelineContext.prototype.analyzeColors = function() {
   // TypeScript knows about ALL extensions via autocomplete
   this.colorStats = analyzeBuffer(this.buffer)
}
```

### 3. Instance-Scoped Memoization

```typescript
PipelineContext.prototype.getContentHash = function() {
   if (!(this as any)._contentHashCache) {
      (this as any)._contentHashCache = crypto.hash(this.buffer)
   }
   return (this as any)._contentHashCache
}

PipelineContext.prototype.getHashPrefix = function() {
   return this.getContentHash().substring(0, 2)  // Uses cached version
}
```

Cache lives on the instance, lifecycle-scoped automatically.

### 4. TypeScript Validates Dependencies

```typescript
// storage.ts
import "./campaign"  // ← Must import dependency

declare module "../PipelineContext" {
   interface PipelineContext {
      getStorageKey(): string
   }
}

PipelineContext.prototype.getStorageKey = function() {
   // TypeScript knows getCampaignKey() exists because
   // we imported campaign.ts which augmented the interface
   return `${this.getCampaignKey()}/${this.storageKey}`
}
```

### 5. Direct Testing

```typescript
import { PipelineContext } from "./PipelineContext"
import "./extensions/campaign"
import "./extensions/storage"

test('storage uses campaign', () => {
   const ctx = new PipelineContext()
   ctx.campaignId = "test"
   ctx.storageKey = "renders"

   expect(ctx.getStorageKey()).toBe("campaign:test/renders")
})
```

No mocks. No framework. Just real implementations.

## Comparison: V1 vs V2 vs V3

| Feature | V1 | V2 | V3 |
|---------|----|----|-----|
| **Dependencies** | Implicit (super-delegate) | Explicit (DI constructors) | Explicit (imports) |
| **Type Safety** | No | Yes (manual) | Yes (TypeScript native) |
| **Framework Lock-in** | Yes | Yes | No |
| **Testing** | Hard | Medium | Easy |
| **Development Flow** | Framework required | Framework required | Direct |
| **Memoization** | Awkward | Complex | Natural |
| **TypeScript Support** | Poor | Custom | Native |

## Migration from V2

### V2 Pattern
```typescript
class _Campaign implements ICampaign {
   constructor(private readonly base: BaseModel) {}

   campaignId = ""
   getCampaignKey() {
      return `campaign:${this.campaignId}`
   }
}

const CampaignExt = defineExtensionV2(...)
```

### V3 Pattern
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

**No extension factory. No DI system. Just TypeScript.**

## Real-World Example

```typescript
// Base context
class PipelineContext {
   jobId = ""
   buffer = Buffer.from("")
}

// Extensions augment via declaration merging
import "./extensions/campaign"
import "./extensions/contentHash"
import "./extensions/storage"
import "./extensions/naming"
import "./extensions/colorAnalysis"

// Use it
const ctx = new PipelineContext()
ctx.jobId = "job-123"
ctx.buffer = loadImage()

// Populate in order
populateCampaign(ctx)
populateContentHash(ctx)      // Memoized
populateStorage(ctx)          // Uses campaign
populateNaming(ctx)           // Uses storage
populateColorAnalysis(ctx)    // Memoized

// All methods available
const path = ctx.getFullPath()
const hash = ctx.getContentHash()
const colors = ctx.colorStats.palette
```

## Conclusion

V3 leverages TypeScript's native declaration merging to eliminate framework complexity while maintaining type safety and clear dependency management. Extensions are just plain TypeScript - no special patterns, no framework lock-in, no testing infrastructure needed.

**The framework doesn't create a special environment - it orchestrates what already exists naturally.**
