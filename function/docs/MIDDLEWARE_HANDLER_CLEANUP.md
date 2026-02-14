# Middleware Handler Cleanup - Deprecated Types Removed

## Summary

Successfully removed deprecated `MiddlewareHandler` and `MiddlewareContext` types, consolidating on the generic `MiddlewareHandler<TContext>` interface with proper context separation.

## Changes Made

### 1. Deleted Deprecated Files

- **`src/painting/middleware/types/MiddlewareHandler.ts`** - Non-generic interface using deprecated MiddlewareContext
- **`src/painting/middleware/types/MiddlewareContext.ts`** - Monolithic context mixing readonly inputs with mutable state

### 2. Updated ItemContextState

Added `buffer` field which was missing but required by storage middleware:

```typescript
export interface ItemContextState {
   disposition: JobDisposition
   error?: Error
   buffer: Buffer  // ← Added: PNG buffer from rendering
   actualFilename?: string
   customData?: Record<string, any>
   retry?: { ... }
}
```

**Rationale**: `buffer` contains the rendered PNG bytes and is mutable state (derived from `pixels`), not readonly input.

### 3. Updated All Middleware Handlers

All 6 middleware implementations now use the generic `MiddlewareHandler<ItemContext>`:

| Handler | Old Type | New Type |
|---------|----------|----------|
| S3StorageHandlerMiddleware | `MiddlewareHandler` | `MiddlewareHandler<ItemContext>` |
| LocalStorageHandlerMiddleware | `MiddlewareHandler` | `MiddlewareHandler<ItemContext>` |
| FileNameResolverMiddleware | `MiddlewareHandler` | `MiddlewareHandler<ItemContext>` |
| ContentSizeFilterMiddleware | `MiddlewareHandler` | `MiddlewareHandler<ItemContext>` |
| ContentHashFileNamerMiddleware | `MiddlewareHandler` | `MiddlewareHandler<ItemContext>` |
| CacheRenderedImageMiddleware | `MiddlewareHandler` | `MiddlewareHandler<ItemContext>` |

**Changes per file**:
```typescript
// Before
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareContext } from "../types/MiddlewareContext.js"

export class S3StorageHandlerMiddleware implements MiddlewareHandler {
   async handle(ctx: MiddlewareContext): Promise<MiddlewareContext> { ... }
}

// After
import { MiddlewareHandler } from "../config/MiddlewareConfigTypes.js"
import { ItemContext } from "../types/ItemContext.js"

export class S3StorageHandlerMiddleware
   implements MiddlewareHandler<ItemContext>
{
   async handle(ctx: ItemContext): Promise<ItemContext> { ... }
}
```

### 4. Updated FileNameResolverMiddleware Context References

Fixed collection property references:

```typescript
// Before (direct properties)
imageIndex: ctx.imageIndex,
totalImages: ctx.totalImages,

// After (nested in collection property with defaults)
imageIndex: ctx.collection?.imageIndex ?? 0,
totalImages: ctx.collection?.totalImages ?? 1,
```

**Rationale**: ItemContext has optional `collection` property, not direct `imageIndex`/`totalImages` fields.

### 5. Updated MiddlewareChainExecutor

Made generic with proper type constraints:

```typescript
// Before
export class MiddlewareChainExecutor {
   constructor(private readonly middlewareChain: MiddlewareHandler[], ...)
   async execute(initialContext: MiddlewareContext): Promise<MiddlewareContext>
}

// After
interface ExecutableContext {
   disposition: JobDisposition
   error?: Error
   jobId?: string
}

export class MiddlewareChainExecutor<
   TContext extends ExecutableContext = ItemContext
> {
   constructor(
      private readonly middlewareChain: Array<MiddlewareHandler<TContext>>,
      ...
   )
   async execute(initialContext: TContext): Promise<TContext>
}
```

**Benefits**:
- Type-safe: Enforces handlers match executor's context type
- Flexible: Works with ItemContext, CollectionContext, or any context with disposition tracking
- Clean: Removed `shouldRetry` field that no longer exists in new context types

### 6. Updated CollectionGatherProcessor

Changed from deprecated MiddlewareContext to ItemContext:

```typescript
// Before
import { MiddlewareContext } from "../types/MiddlewareContext.js"

async processCollection(
   childrenValues: Record<string, MiddlewareContext>,
): Promise<any>

// After
import { ItemContext } from "../types/ItemContext.js"

async processCollection(
   childrenValues: Record<string, ItemContext>,
): Promise<any>
```

### 7. Updated types/index.ts Exports

Removed exports of deleted files:

```typescript
// Removed:
export * from "./MiddlewareHandler.js"
export * from "./MiddlewareContext.js"
```

Now only exports modern context types (ItemContext, CollectionContext) and core types.

---

## Architecture After Cleanup

### Context Type Hierarchy

```
ItemContext = ItemContextInput & ItemContextState
   ├─ ItemContextInput (readonly)
   │  ├─ jobId: string
   │  ├─ pixels: ImageData
   │  ├─ metadata: {...}
   │  ├─ filenameExpression?: string
   │  └─ collection?: { imageIndex, totalImages }
   │
   └─ ItemContextState (mutable)
      ├─ disposition: JobDisposition
      ├─ error?: Error
      ├─ buffer: Buffer              ← Added in this cleanup
      ├─ actualFilename?: string
      ├─ customData?: Record<...>
      └─ retry?: {...}

CollectionContext = CollectionContextInput & CollectionContextState
   ├─ CollectionContextInput (readonly)
   │  └─ childResults: Array<T | null | ErrorMarker>
   │
   └─ CollectionContextState (mutable)
      ├─ disposition: JobDisposition
      ├─ error?: Error
      ├─ customData?: Record<...>
      └─ retry?: {...}
```

### Middleware Handler Interface

**Single Source of Truth**: `config/MiddlewareConfigTypes.ts`

```typescript
export interface MiddlewareHandler<TContext = any> {
   handle: (ctx: TContext) => Promise<TContext>
}
```

**Usage**:
- Item middleware: `implements MiddlewareHandler<ItemContext>`
- Collection middleware: `implements MiddlewareHandler<CollectionContext>`
- Custom middleware: `implements MiddlewareHandler<MyCustomContext>`

---

## Benefits of Cleanup

### 1. Single Source of Truth
- One `MiddlewareHandler` interface (was two)
- Clear separation: readonly inputs vs mutable state
- No deprecated types lingering in codebase

### 2. Type Safety
- `MiddlewareChainExecutor<TContext>` enforces handler/context compatibility
- Compiler catches mismatched context types
- Generic constraints (`extends ExecutableContext`) ensure required fields exist

### 3. Clear Semantics
- `ItemContextInput` clearly marks immutable job parameters
- `ItemContextState` clearly marks mutable middleware state
- `buffer` placement makes sense (derived from pixels, mutable)

### 4. Better DX
- IDE autocomplete shows correct context fields
- No confusion about which MiddlewareHandler to use
- Collection properties properly nested (`ctx.collection?.imageIndex`)

### 5. Maintainability
- Less code to maintain (2 fewer files)
- Consistent patterns across all handlers
- Easy to add new context types without duplicating handler interface

---

## Migration Pattern for Future Code

If you find old code still using deprecated types:

```typescript
// Old pattern
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareContext } from "../types/MiddlewareContext.js"

class MyMiddleware implements MiddlewareHandler {
   async handle(ctx: MiddlewareContext): Promise<MiddlewareContext> {
      const { imageIndex, buffer, actualFilename } = ctx
      // ...
   }
}

// New pattern
import { MiddlewareHandler } from "../config/MiddlewareConfigTypes.js"
import { ItemContext } from "../types/ItemContext.js"

class MyMiddleware implements MiddlewareHandler<ItemContext> {
   async handle(ctx: ItemContext): Promise<ItemContext> {
      const { buffer, actualFilename } = ctx
      const imageIndex = ctx.collection?.imageIndex ?? 0
      // ...
   }
}
```

**Key changes**:
1. Import from `config/MiddlewareConfigTypes.js` (not `types/MiddlewareHandler.js`)
2. Import `ItemContext` (not `MiddlewareContext`)
3. Add type parameter: `implements MiddlewareHandler<ItemContext>`
4. Update handle signature: `(ctx: ItemContext): Promise<ItemContext>`
5. Access collection properties via `ctx.collection?.` (not directly on ctx)

---

## Verification

The middleware refactoring compiles cleanly. Remaining build errors are from:
- Ongoing DTO refactoring (PartialPaintRequest, PartialPaintResult exports)
- Cache integration type issues (ULID strings, injection tokens)
- Expression function issues (regionMapName property access)

None of these are from the MiddlewareHandler/MiddlewareContext cleanup.

---

## Files Modified

### Deleted (2 files)
- `src/painting/middleware/types/MiddlewareHandler.ts`
- `src/painting/middleware/types/MiddlewareContext.ts`

### Modified - Core Types (3 files)
- `src/painting/middleware/types/ItemContextState.ts` - Added `buffer` field
- `src/painting/middleware/types/index.ts` - Removed deprecated exports
- `src/painting/middleware/base/MiddlewareChainExecutor.ts` - Made generic with constraints

### Modified - Handlers (6 files)
- `src/painting/middleware/handlers/S3StorageHandlerMiddleware.ts`
- `src/painting/middleware/handlers/LocalStorageHandlerMiddleware.ts`
- `src/painting/middleware/handlers/FileNameResolverMiddleware.ts`
- `src/painting/middleware/handlers/ContentSizeFilterMiddleware.ts`
- `src/painting/middleware/handlers/ContentHashFileNamerMiddleware.ts`
- `src/painting/middleware/handlers/CacheRenderedImageMiddleware.ts`

### Modified - Other (1 file)
- `src/painting/middleware/collection/CollectionGatherProcessor.ts` - Updated context types

**Total**: 2 deleted, 10 modified
