# Middleware Architecture - TypeScript Declaration Merging

## Quick Start

```bash
# Run the example
npx tsx src/painting/middleware/types/__examples__/example.ts

# Run tests
npm test -- __examples__/__tests__/PipelineContext.test.ts
npm test -- __examples__/__tests__/serialization.test.ts
```

## Overview

The middleware architecture uses **TypeScript's native declaration merging** to extend a pipeline context across multiple files. No framework lock-in, natural development flow, direct testability.

> **Note**: This supersedes the V1/V2 architectures (now archived in `atticV1/`).

## The Pattern (from TypeScript Docs)

```typescript
// observable.ts
export class Observable<T> { }

// map.ts
import { Observable } from "./observable"

declare module "./observable" {
  interface Observable<T> {
    map<U>(f: (x: T) => U): Observable<U>
  }
}

Observable.prototype.map = function (f) { /* ... */ }

// consumer.ts
import { Observable } from "./observable"
import "./map"

let o: Observable<number>
o.map((x) => x.toFixed())  // ✓ Works!
```

## Our Implementation

### 1. Base Context

[PipelineContext.ts](./PipelineContext.ts) - Framework-owned properties only

### 2. Extensions

Each extension file in [extensions/](./extensions/):
- Augments `PipelineContext` interface
- Adds methods to prototype
- Exports populate function

Example: [extensions/campaign.ts](./extensions/campaign.ts)

### 3. Barrel File

[extensions/index.ts](./extensions/index.ts) - Imports in dependency order

### 4. Executor

[PipelineExecutor.ts](./PipelineExecutor.ts) - Trivial coordinator

## Key Files

- **[V3_ARCHITECTURE.md](./V3_ARCHITECTURE.md)** - Detailed architecture documentation
- **[COMPARISON.md](./COMPARISON.md)** - Evolution from V1 → V2 → V3
- **[SERIALIZATION.md](./SERIALIZATION.md)** - Symbol properties for clean serialization
- **[example.ts](./example.ts)** - Runnable example
- **[__tests__/PipelineContext.test.ts](./__tests__/PipelineContext.test.ts)** - Test suite
- **[__tests__/serialization.test.ts](./__tests__/serialization.test.ts)** - Serialization tests

## Why This Architecture?

### No Framework Lock-in

```typescript
// Test without any framework
import { PipelineContext } from "./PipelineContext"
import "./extensions/index"

const ctx = new PipelineContext()
ctx.campaignId = "test"
expect(ctx.getCampaignKey()).toBe("campaign:test")
```

### Natural Development

```typescript
// Write extensions as plain TypeScript
declare module "./PipelineContext" {
   interface PipelineContext {
      myNewMethod(): string
   }
}

PipelineContext.prototype.myNewMethod = function() {
   // TypeScript autocomplete shows ALL available properties/methods
   return `${this.getCampaignKey()}/${this.fileName}`
}
```

### Instance-Scoped Memoization

```typescript
PipelineContext.prototype.getContentHash = function() {
   if (!(this as any)._cache) {
      (this as any)._cache = crypto.hash(this.buffer)
   }
   return (this as any)._cache
}
```

### TypeScript Validates Dependencies

```typescript
// storage.ts
import "./campaign"  // ← Must import dependency

PipelineContext.prototype.getStorageKey = function() {
   // TypeScript knows getCampaignKey() exists
   return `${this.getCampaignKey()}/${this.storageKey}`
}
```

## Benefits Summary

- ✓ **No framework lock-in** - Extensions work independently
- ✓ **Native TypeScript** - Uses built-in declaration merging
- ✓ **Direct testability** - No mocks or harness needed
- ✓ **Natural memoization** - Caches live on instances
- ✓ **Type-safe dependencies** - Import order = dependency order
- ✓ **Simple infrastructure** - ~50 lines vs ~600 in V2

## The Core Insight

> **Extensions exist naturally. The framework merely orchestrates what already works.**

Previous V1/V2 architectures (now in `atticV1/`) tried to solve problems that TypeScript already solved. This architecture embraces TypeScript's native capabilities instead of fighting them.

## Learn More

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete architecture guide
- [COMPARISON.md](./COMPARISON.md) - Evolution from V1/V2 to current architecture
- [SERIALIZATION.md](./SERIALIZATION.md) - Symbol properties for clean serialization
- [TypeScript Declaration Merging Docs](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)
