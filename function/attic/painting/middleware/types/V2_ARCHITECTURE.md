# V2 Architecture - Dependency Injection Pattern

## Overview

Version 2 of the middleware framework introduces explicit **dependency injection** to solve the non-deterministic initialization problem while maintaining the **super-delegate pattern** for framework middleware that needs to see all accumulated extensions.

## Problem Statement

V1 allowed extensions to call each other's methods via the super-delegate, but this created dangerous implicit dependencies:

```typescript
class SuffixExtension extends BaseModel {
   suffix = ""
   getFullNameWithSuffix() {
      // Implicitly depends on NameExtension.getFullName()
      // Non-deterministic initialization order!
      return `${(this as any).getFullName()}-${this.suffix}`
   }
}
```

**Issues:**
- No declared dependency between `SuffixExtension` and `NameExtension`
- NestJS initialization order is undefined for peer extensions
- Extensions could fail unpredictably depending on execution order
- No type safety for cross-extension calls

## Solution: Dependency Injection

V2 uses constructor-based dependency injection with explicit type declarations:

```typescript
interface IName {
   name: string
   getFullName(): string
}

class _Name implements IName {
   constructor(private readonly base: BaseModel) {}
   name = ""
   getFullName() {
      return `${this.base.prefix}-${this.name}`
   }
}

interface ISuffix {
   suffix: string
   getFullNameWithSuffix(): string
}

class _Suffix implements ISuffix {
   constructor(
      private readonly base: BaseModel,
      private readonly nameExt: IName  // Explicit dependency!
   ) {}

   suffix = ""
   getFullNameWithSuffix() {
      // Type-safe call to injected dependency
      return `${this.nameExt.getFullName()}-${this.suffix}`
   }
}
```

## Key Components

### 1. ExtensionFactoryV2

Replaces V1's `defineExtension()` with dependency-aware factory:

```typescript
// If your class has instance fields, provide an exemplar:
const base = new BaseModel()
const exemplar = new _Name(base)

const NameExt = defineExtensionV2<BaseModel, _Name, IName>(
   BaseModel,           // Base type
   _Name,              // Implementation class
   ["base"],           // Dependency names
   [BaseModel],        // Dependency types
   exemplar            // Exemplar for scanning instance fields (optional)
)

const SuffixExt = defineExtensionV2<BaseModel, _Suffix, ISuffix>(
   BaseModel,
   _Suffix,
   ["base", "nameExt"],
   [BaseModel, _Name]   // Explicit dependency types
)
```

**Features:**
- Extracts constructor parameter names and types
- Creates DTO class for data-only properties
- Stores dependency metadata for resolution

### 2. DependencyResolver

Manages instance lifecycle and dependency injection:

```typescript
const resolver = new DependencyResolver()

// Register base
resolver.registerBase(BaseModel, baseInstance)

// Build Name extension (depends only on base)
const nameInstance = resolver.build(NameExt)

// Register Name so Suffix can resolve it
resolver.registerBase(_Name, nameInstance)

// Build Suffix extension (automatically injects base + nameExt)
const suffixInstance = resolver.build(SuffixExt)
```

**Features:**
- Resolves dependencies by type
- Detects circular dependencies
- Idempotent: returns same instance if already built
- Populates instance fields from accumulated data

### 3. MiddlewareChainBuilderV2

Integrates dependency injection with super-delegate pattern:

```typescript
const result = await new MiddlewareChainBuilderV2(base, BaseModel)
   .add(NameExt, nameHandler)      // Application middleware with DI
   .add(SuffixExt, suffixHandler)  // Application middleware with DI
   .add(LoggerExt, loggerHandler)  // Framework middleware (sees all)
   .execute()
```

**Execution flow:**

1. **Handler execution**: Run middleware handler with super-delegate (sees all previous extensions)
2. **Data accumulation**: Merge handler's output into accumulated context
3. **Instance creation**: Build extension instance with DI (gets current accumulated data)
4. **Registration**: Register instance for future dependencies

## Diamond Pattern Support

V2 fully supports diamond inheritance with idempotent base sharing:

```
        IBase
       /     \
   IExtOne  IExtTwo
       \     /
      IExtThree
```

```typescript
class _ExtThree implements IExtThree {
   constructor(
      private readonly extOne: IExtOne,
      private readonly extTwo: IExtTwo
   ) {}

   biz() {
      // Both extOne and extTwo share the same base instance
      return this.extOne.foo() + this.extTwo.bar()
   }
}

const ExtThreeDef = defineExtensionV2(
   Base,
   _ExtThree,
   ["extOne", "extTwo"],
   [_ExtOne, _ExtTwo]  // Diamond dependencies
)
```

See [DiamondPatternExample.ts](src/painting/middleware/types/__examples__/DiamondPatternExample.ts) for full example.

## Benefits

### 1. Predictable Initialization

Dependencies are explicit and resolved in deterministic order:
- Base is always created first
- Extensions are built only after their dependencies exist
- No race conditions or non-deterministic behavior

### 2. Type Safety

TypeScript enforces dependency types:
```typescript
class _Suffix implements ISuffix {
   constructor(
      private readonly base: BaseModel,
      private readonly nameExt: IName  // Type-checked!
   ) {}
}
```

### 3. Testability

Extensions can be tested in isolation:
```typescript
const mockBase = new BaseModel()
const mockName = { getFullName: () => "mock-name" }
const suffix = new _Suffix(mockBase, mockName)
expect(suffix.getFullNameWithSuffix()).toBe("mock-name-test")
```

### 4. Framework Middleware Support

Framework middleware (NameBy, FilterBy, GroupBy) can still see ALL extensions via super-delegate:

```typescript
class LoggerHandler implements MiddlewareHandler<any, undefined> {
   async handle(ctx: any) {
      // ctx is super-delegate with all extensions
      console.log(ctx.getCampaignKey())
      console.log(ctx.getStoragePath())
      console.log(ctx.getFullPath())
      // ... etc
   }
}
```

### 5. Clear Dependency Graph

Dependencies are self-documenting:

```typescript
defineExtensionV2(Base, Storage, ["base", "campaign"], [Base, Campaign])
//                                  ^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^
//                                  Parameter names      Parameter types
```

## Migration from V1

### V1 Pattern (Implicit Dependencies)

```typescript
class Extension1 extends BaseModel {
   field1 = ""
   getField1Upper() {
      return this.field1.toUpperCase()
   }
}

class Extension2 extends BaseModel {
   field2 = 0
   getCombined() {
      // Implicit dependency - dangerous!
      return `${(this as any).getField1Upper()}-${this.field2}`
   }
}

const Ext1 = defineExtension(BaseModel, Extension1)
const Ext2 = defineExtension(BaseModel, Extension2)
```

### V2 Pattern (Explicit Dependencies)

```typescript
interface IExt1 {
   field1: string
   getField1Upper(): string
}

class _Extension1 implements IExt1 {
   constructor(private readonly base: BaseModel) {}
   field1 = ""
   getField1Upper() {
      return this.field1.toUpperCase()
   }
}

interface IExt2 {
   field2: number
   getCombined(): string
}

class _Extension2 implements IExt2 {
   constructor(
      private readonly base: BaseModel,
      private readonly ext1: IExt1  // Explicit dependency!
   ) {}

   field2 = 0
   getCombined() {
      // Type-safe, guaranteed to exist
      return `${this.ext1.getField1Upper()}-${this.field2}`
   }
}

const Ext1 = defineExtensionV2(BaseModel, _Extension1, ["base"], [BaseModel])
const Ext2 = defineExtensionV2(BaseModel, _Extension2, ["base", "ext1"], [BaseModel, _Extension1])
```

## Key Differences: V1 vs V2

| Feature | V1 | V2 |
|---------|----|----|
| **Dependencies** | Implicit (via super-delegate) | Explicit (constructor injection) |
| **Type Safety** | No | Yes |
| **Initialization** | Non-deterministic for peers | Deterministic dependency order |
| **Diamond Pattern** | Not supported | Fully supported with idempotent base |
| **Testing** | Hard (need full context) | Easy (mock dependencies) |
| **Framework Middleware** | Supported | Still supported (super-delegate) |

## Examples

- [DiamondPatternExample.ts](src/painting/middleware/types/__examples__/DiamondPatternExample.ts) - Diamond inheritance with DI
- [MiddlewareChainBuilderV2Example.ts](src/painting/middleware/types/__examples__/MiddlewareChainBuilderV2Example.ts) - Full middleware chain with linear dependencies
- [ExtensionFactoryV2.test.ts](src/painting/middleware/types/__tests__/ExtensionFactoryV2.test.ts) - Unit tests for factory and resolver
- [MiddlewareChainBuilderV2.test.ts](src/painting/middleware/types/__tests__/MiddlewareChainBuilderV2.test.ts) - Integration tests for builder

## Next Steps

1. **Migrate existing middleware** to V2 pattern:
   - Identify cross-extension dependencies
   - Convert to explicit DI
   - Add interface definitions

2. **Update configuration** to use MiddlewareChainBuilderV2:
   - Replace MiddlewareChainExecutor
   - Configure DependencyResolver
   - Wire up extension definitions

3. **Remove V1 code** once migration is complete:
   - ExtensionFactory.ts
   - MiddlewareChainBuilder.ts
   - Update documentation

## Architecture Diagram

```
MiddlewareChainBuilderV2
    ↓
DependencyResolver
    ↓
ExtensionDefinitionV2
    ├─ Implementation (class with constructor deps)
    ├─ DTO (data-only class)
    └─ Dependencies (param names + types)

Execution Flow:
    1. Handler runs (with super-delegate)
    2. Accumulate handler output
    3. Build extension instance (with DI)
    4. Register instance
    5. Repeat for next middleware

Final Result:
    Super-delegate with all extensions + all data
```

## Conclusion

V2 architecture solves the non-deterministic initialization problem while preserving the super-delegate pattern that framework middleware needs. Extensions declare their dependencies explicitly, making the system predictable, testable, and type-safe.
