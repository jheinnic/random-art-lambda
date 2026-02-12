# Extension Factory Pattern

> ⚠️ **DEPRECATED - Use V2 Instead**
>
> This V1 pattern has non-deterministic initialization issues when extensions implicitly depend on each other.
>
> **Use V2 with explicit dependency injection:**
> - [V2_ARCHITECTURE.md](./V2_ARCHITECTURE.md) - Complete V2 documentation
> - [DiamondPatternExample.ts](./__examples__/DiamondPatternExample.ts) - Dependency injection example
> - [MiddlewareChainBuilderV2Example.ts](./__examples__/MiddlewareChainBuilderV2Example.ts) - Full middleware chain
>
> This file is kept for reference only.

## Overview

The ExtensionFactory provides a way to write model extensions naturally (as classes with data + methods) and have them automatically decomposed into three parts:

1. **DTO** - Data Transfer Object (serializable data only)
2. **Extension** - Static helper methods with proper `this` binding
3. **Delegate** - Unified proxy that combines Base + DTO + Extension

## The Problem It Solves

### Before: Manual Duplication (Painful)

```typescript
// 1. Define interface
interface MyExtension {
   new(): this
   getCampaignHash: (this: MyDelegate, ...) => string
   getFilename: (this: MyDelegate, ...) => string
}

// 2. Manually replicate in static class
class MyExtensionStatic {
   private constructor() {}

   static getCampaignHash(
      this: DelegateForExtension<MyExtension, BaseModel>
   ): string {
      return hash(this.campaignName + this.seedValue)
   }

   static getFilename(
      this: DelegateForExtension<MyExtension, BaseModel>
   ): string {
      return this.getCampaignHash() + '.png'
   }
}

// 3. Define DTO separately
interface MyDTO {
   campaignName: string
   seedValue: number
}
```

### After: Natural Writing (Easy!)

```typescript
// Just write a normal class!
class CampaignExtension extends BaseModel {
   // Data properties
   campaignName: string = ""
   seedValue: number = 0

   // Methods can call each other via `this`
   getCampaignHash(): string {
      return hash(this.campaignName + this.seedValue.toString())
   }

   getFilename(): string {
      return `${this.getCampaignHash()}.png`
   }
}

// Factory does the decomposition
const Campaign = defineExtension(BaseModel, CampaignExtension)
```

## How It Works

### 1. Define Your Extension Naturally

Write a class that extends your base model. Add data properties and helper methods:

```typescript
class MyCampaignExtension extends BaseModel {
   // Data (will become DTO)
   campaignName: string = ''
   seedValue: number = 0

   // Helpers (will become static extension methods)
   getCampaignHash(): string {
      return hash(this.campaignName + this.seedValue.toString())
   }

   getFilename(): string {
      // Can call other methods via `this`!
      const hash = this.getCampaignHash()
      return `${hash.slice(0, 2)}/${hash.slice(2, 14)}.png`
   }
}
```

### 2. Decompose with Factory

```typescript
import { defineExtension } from './ExtensionFactory.js'

const Campaign = defineExtension(BaseModel, MyCampaignExtension)
```

### 3. Use the Parts

```typescript
// Campaign.DTO - for serialization
type CampaignDTO = InstanceType<typeof Campaign.DTO>
// { campaignName: string, seedValue: number }

// Campaign.Extension - static methods with `this: Delegate`
Campaign.Extension.getCampaignHash.call(someContext, ...)

// Campaign.Delegate - unified type
type CampaignDelegate = InstanceType<typeof Campaign.Delegate>
// { buffer, jobId, metadata, campaignName, seedValue, getCampaignHash(), getFilename() }
```

### 4. Create Unified Context at Runtime

```typescript
import { createDelegate } from './ExtensionFactory.js'

// Base model (from framework)
const base: BaseModel = {
   buffer: Buffer.from('...'),
   jobId: 'job-123',
   metadata: { width: 800, height: 600 }
}

// DTO with data (from user input or previous middleware)
const dto = new Campaign.DTO()
dto.campaignName = 'summer2024'
dto.seedValue = 42

// Create unified delegate
const delegate = createDelegate(base, dto, Campaign.Extension)

// Now delegate has everything!
console.log(delegate.jobId)              // From base
console.log(delegate.campaignName)       // From DTO
console.log(delegate.getCampaignHash())  // From extension
console.log(delegate.getFilename())      // Calls getCampaignHash() internally!
```

## Integration with jse-eval

The delegate is perfect for passing to jse-eval expressions:

```typescript
import { compileAsync } from 'jse-eval'

const expression = "`${getCampaignHash().slice(0, 12)}.png`"
const fn = compileAsync(expression)

// Pass the unified delegate as context
const result = await fn(delegate)
// "XyZ_AbC12345.png"
```

The expression sees a **flat namespace** with:
- Base properties (buffer, jobId, metadata)
- DTO properties (campaignName, seedValue)
- Extension methods (getCampaignHash, getFilename)

## How the Proxy Works

The `createDelegate` function creates a Proxy that:

1. **Looks up properties** in this order:
   - DTO data properties
   - Base model properties
   - Extension static methods

2. **Binds extension methods** to the proxy itself as `this`:
   ```typescript
   get(target, prop) {
      if (prop in Extension) {
         const method = Extension[prop]
         return method.bind(delegate)  // Bind to unified context!
      }
   }
   ```

3. **Enables method chaining** via `this`:
   - When `getFilename()` calls `this.getCampaignHash()`
   - `this` is the delegate proxy
   - Which provides access to campaignName and seedValue

## Type Safety

TypeScript infers the correct types at compile time:

```typescript
// DTO has only data
type DTO = DataPropertiesOf<CampaignExtension>
// { campaignName: string, seedValue: number }

// Delegate has everything (Base + DTO + methods without `this` param)
type Delegate = DelegateOf<BaseModel, CampaignExtension>
// {
//   buffer: Buffer,
//   jobId: string,
//   metadata: { width, height },
//   campaignName: string,
//   seedValue: number,
//   getCampaignHash(): string,
//   getFilename(): string
// }
```

## Middleware Usage

In the middleware chain, each handler receives a unified delegate:

```typescript
class CampaignMiddleware implements MiddlewareHandler {
   async handle(ctx: CampaignDelegate) {
      // Type-safe access to everything
      const buffer = ctx.buffer              // From base
      const campaign = ctx.campaignName      // From DTO
      const filename = ctx.getFilename()     // From extension

      // Compile expression and pass ctx directly
      const fn = compileAsync(this.expression)
      const result = await fn(ctx)

      return { model: { filename }, disposition: 'OK' }
   }
}
```

## Benefits

1. **Write Once**: Define your extension class naturally
2. **Automatic Decomposition**: Factory splits it into DTO + Extension + Delegate
3. **Type Safety**: Full TypeScript inference
4. **Method Chaining**: Methods can call each other via `this`
5. **Unified Context**: Single proxy with all layers visible
6. **jse-eval Ready**: Perfect for expression evaluation

## Multi-Level Inheritance

The factory supports 3-4 levels of inheritance depth by walking the entire prototype chain:

```typescript
// Base → Level1 → Level2 → Level3 → Level4
class Level1Extension extends BaseModel {
   level1Field: string = ""
   getLevel1(): string { return `L1:${this.level1Field}` }
}

class Level2Extension extends Level1Extension {
   level2Field: number = 0
   getLevel2(): string { return `L2:${this.level2Field}-${this.getLevel1()}` }
}

class Level3Extension extends Level2Extension {
   level3Field: boolean = false
   getLevel3(): string { return `L3:${this.level3Field}-${this.getLevel2()}` }
}

// Factory extracts ALL properties and methods from the entire chain
const Level3Def = defineExtension(BaseModel, Level3Extension)
```

The factory walks up the prototype chain until it reaches the Base class, collecting:
- All data properties from every level
- All methods from every level
- Preserving method chaining across all levels

### Branching Inheritance

Multiple extensions can branch from a common parent (forest pattern):

```typescript
class CommonParent extends Base {
   sharedField: string = ""
   getShared(): string { return this.sharedField }
}

// Branch A
class StorageExtension extends CommonParent {
   storagePrefix: string = ""
   getStoragePath(): string { return `${this.storagePrefix}/${this.getShared()}` }
}

// Branch B (independent from Branch A)
class NamingExtension extends CommonParent {
   fileExtension: string = ""
   getFileName(): string { return `${this.getShared()}${this.fileExtension}` }
}

const Storage = defineExtension(Base, StorageExtension)
const Naming = defineExtension(Base, NamingExtension)
```

Each branch:
- Inherits from the common parent independently
- Has its own namespace (no conflicts between siblings)
- Can be composed separately in middleware chains
- Follows last-wins semantics when merged via Builder

## Testing

Run the verification tests:

```bash
# Basic functionality
npx tsx src/painting/middleware/types/__examples__/ExtensionFactoryManualTest.ts

# Multi-level inheritance (4 levels deep)
npx tsx src/painting/middleware/types/__examples__/MultiLevelInheritanceTest.ts

# Branching inheritance (forest pattern)
npx tsx src/painting/middleware/types/__examples__/BranchingInheritanceTest.ts
```

## Files

- `ExtensionFactory.ts` - Core factory implementation
- `__examples__/ExtensionFactoryExample.ts` - Usage examples
- `__examples__/ExtensionFactoryManualTest.ts` - Basic verification
- `__examples__/MultiLevelInheritanceTest.ts` - Multi-level inheritance test
- `__examples__/BranchingInheritanceTest.ts` - Branching inheritance test
