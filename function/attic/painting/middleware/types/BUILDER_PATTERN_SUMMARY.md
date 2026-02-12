# MiddlewareChainBuilder - Intersection Type Accumulation

## Overview

The `MiddlewareChainBuilder` implements a Builder pattern for composing middleware chains with **intersection type accumulation** instead of tuple slicing.

## Key Concepts

### 1. Intersection Types vs. Tuple Slicing

**Old approach (conceptual):**
```typescript
type Chain = [Handler1, Handler2, Handler3]
type AfterStep1 = SliceBefore<Chain, 1>  // Complex tuple manipulation
type AfterStep2 = SliceBefore<Chain, 2>  // More slicing...
```

**New approach (implemented):**
```typescript
builder.add(Handler1)  // TBase
builder.add(Handler2)  // TBase & Handler1Delegate
builder.add(Handler3)  // TBase & Handler1Delegate & Handler2Delegate
```

Each `.add()` call accumulates types via intersection: `TAccumulated & TNewDelegate`

### 2. Cumulative Super-Delegate

At each middleware step, we create a **super-delegate** that includes:
- Base context properties
- All accumulated data from previous steps
- All extension methods from ALL previous steps (not just current)

This allows:
```typescript
class Handler2 {
   async handle(ctx) {
      // Can access data from Handler1
      const field1 = ctx.field1

      // Can call methods from Handler1's extension
      const result = ctx.getField1Upper()
   }
}
```

### 3. Method Chaining Across Extensions

Extensions can call methods from other extensions:

```typescript
class StorageExtension extends CampaignExtension {
   getStoragePath() {
      // Calls getCampaignKey() from CampaignExtension
      return `${this.storagePrefix}/${this.getCampaignKey()}`
   }
}
```

The super-delegate's Proxy ensures all methods are bound correctly.

## Implementation Details

### Builder Pattern

```typescript
class MiddlewareChainBuilder<TBase, TAccumulated = TBase> {
   add<TBlueprint, TDelegate>(
      extensionDef: ExtensionDefinition<TBase, TBlueprint, TDelegate>,
      handler: MiddlewareHandler
   ): MiddlewareChainBuilder<TBase, TAccumulated & TDelegate>
}
```

Each `.add()` returns a new builder with widened accumulated type.

### Super-Delegate Creation

```typescript
private createSuperDelegate(accumulated: any, extensions: any[]): any {
   return new Proxy(accumulated, {
      get(target, prop, receiver) {
         // 1. Check accumulated data
         if (prop in target) return Reflect.get(target, prop, receiver)

         // 2. Check ALL extensions for methods
         for (const extension of extensions) {
            if (prop in extension) {
               const method = extension[prop]
               return method.bind(receiver)  // Bind to super-delegate
            }
         }
      }
   })
}
```

### Execution Flow

```typescript
async execute(): Promise<TAccumulated> {
   let accumulated = this.baseContext
   const allExtensions = []

   for (const step of this.steps) {
      allExtensions.push(step.extensionDef.Extension)

      // Create cumulative super-delegate with ALL extensions so far
      const delegate = this.createSuperDelegate(
         { ...this.baseContext, ...accumulated },
         allExtensions
      )

      // Execute middleware
      const result = await step.handler.handle(delegate)

      // Accumulate data
      accumulated = { ...accumulated, ...result.model }
   }

   // Return final super-delegate
   return this.createSuperDelegate(accumulated, allExtensions)
}
```

## Benefits

1. **Natural Composition**: Builder pattern is intuitive and chainable
2. **Type Safety**: TypeScript tracks accumulated types via intersections
3. **Method Chaining**: Extensions can call each other's methods
4. **Cumulative Context**: Each step sees all previous data and methods
5. **No Tuple Complexity**: Avoids complex type-level tuple manipulation

## Example Usage

See:
- `__examples__/MiddlewareChainBuilderExample.ts` - Full working example
- `__tests__/MiddlewareChainBuilder.test.ts` - Comprehensive tests

## Comparison to forEach Iteration

### Old (forEach with spread):
```typescript
for (const middleware of chain) {
   const result = await middleware.handle(ctx, parser)
   ctx = { ...ctx, ...result.model }  // Runtime spread
   parserExtensions.push(result.parserExtension)
}
```

### New (Builder with intersection types):
```typescript
const result = await new MiddlewareChainBuilder(base)
   .add(Ext1, handler1)  // Compile-time type accumulation
   .add(Ext2, handler2)
   .add(Ext3, handler3)
   .execute()
```

The Builder approach:
- Provides better type inference
- Makes the chain structure explicit
- Enables cumulative super-delegate pattern
- Eliminates need for Parser parameter (replaced by super-delegate)
