# Middleware Configuration Architecture

## Overview

This system provides declarative middleware chain configuration with automatic dependency injection via NestJS. Internal implementation tokens are auto-generated, eliminating boilerplate.

## Key Design Decisions

### 1. Standardized Constructor Signature

All middleware handlers MUST follow this constructor pattern:

```typescript
constructor(
   params: ParamsType,           // Position 0: Value object with configuration
   logger: Logger,               // Position 1: Auto-injected logger (mandatory)
   ...dependencies               // Position 2+: Injected dependencies (mandatory)
)
```

**Why this matters:**
- Logger is framework-provided and auto-injected - no token needed in config
- Logger is **mandatory** (not optional) since DI always provides it
- Params are always first for consistency
- Dependencies are **mandatory** since DI always provides them (no runtime validation needed)
- Dependencies start at position 2, making `TokensForDependencies` type inference work correctly

### 2. Auto-Generated Internal Tokens

The factory automatically generates three tokens per middleware:
- `Symbol(`${ClassName}_${index}_params`)` - For value parameters
- `Symbol(`${ClassName}_${index}_logger`)` - For logger instance
- `Symbol(`${ClassName}_${index}`)` - For middleware instance

**Benefits:**
- No boilerplate token declarations in config
- Debug-friendly token names (include class name and position)
- Impossible to have token collisions
- Config focuses only on business logic

### 3. Minimal Configuration Interface

```typescript
interface MiddlewareProps<M extends Type<MiddlewareHandler>> {
   middlewareClass: M                    // The class to instantiate
   valueParams: ConstructorParameters<M>[0]  // Config data
   inject?: TokensForDependencies<M>     // Tokens for dependencies (position 2+)
}
```

**What's NOT in the config:**
- `injectToken` - auto-generated
- `paramsToken` - auto-generated
- `loggerToken` - auto-generated (not even exposed)

## Example Usage

### Simple Middleware (No Dependencies)

```typescript
// Handler definition
class ContentSizeFilterMiddleware implements MiddlewareHandler {
   constructor(
      params: { minSize?: number; maxSize?: number; isFatal?: boolean },
      logger: Logger
   ) {
      // Implementation
   }
}

// Configuration
{
   middlewareClass: ContentSizeFilterMiddleware,
   valueParams: {
      minSize: 1024,
      maxSize: 10 * 1024 * 1024,
      isFatal: false,
   },
   // No inject needed - no dependencies after logger
}
```

### Middleware With Dependencies

```typescript
// Handler definition
class FileNameResolverMiddleware implements MiddlewareHandler {
   constructor(
      _params: Record<string, never>,    // No config needed
      logger: Logger,
      expressionEvaluator: ExpressionEvaluator,  // Position 2
      customFunctions?: Record<string, Function>  // Position 3 (truly optional)
   ) {
      // Implementation
   }
}

// Configuration
{
   middlewareClass: FileNameResolverMiddleware,
   valueParams: {},
   inject: [
      MiddlewareDependencies.ExpressionAddons,  // Maps to position 2
   ],
   // Position 3 is optional, so we can omit it
}
```

### Middleware With Storage Dependency

```typescript
// Handler definition
class S3StorageHandlerMiddleware implements MiddlewareHandler {
   constructor(
      _params: Record<string, never>,
      logger: Logger,
      s3Store: IResultStore  // Position 2
   ) {
      // Implementation
   }
}

// Configuration
{
   middlewareClass: S3StorageHandlerMiddleware,
   valueParams: {},
   inject: [MiddlewareDependencies.S3FileStore],
}
```

## Complete Configuration Example

```typescript
const config: MiddlewareConfig = {
   itemChain: [
      {
         middlewareClass: FileNameResolverMiddleware,
         valueParams: {},
         inject: [MiddlewareDependencies.ExpressionAddons],
      },
      {
         middlewareClass: ContentSizeFilterMiddleware,
         valueParams: { minSize: 1024, maxSize: 10485760, isFatal: false },
      },
      {
         middlewareClass: S3StorageHandlerMiddleware,
         valueParams: {},
         inject: [MiddlewareDependencies.S3FileStore],
      },
   ],
   collectionChain: [],
}
```

## How It Works

### 1. Provider Generation

For each middleware, the factory creates three providers:

```typescript
// Params provider
{
   provide: Symbol('ContentSizeFilterMiddleware_0_params'),
   useValue: { minSize: 1024, maxSize: 10485760, isFatal: false }
}

// Logger provider
{
   provide: Symbol('ContentSizeFilterMiddleware_0_logger'),
   useFactory: () => new Logger('ContentSizeFilterMiddleware'),
   inject: []
}

// Middleware provider
{
   provide: Symbol('ContentSizeFilterMiddleware_0'),
   useFactory: (params, logger, ...deps) =>
      new ContentSizeFilterMiddleware(params, logger, ...deps),
   inject: [
      Symbol('ContentSizeFilterMiddleware_0_params'),
      Symbol('ContentSizeFilterMiddleware_0_logger'),
      // ...any additional dependency tokens from config.inject
   ]
}
```

### 2. Chain Executor Creation

The factory collects middleware tokens in order and creates a chain executor:

```typescript
{
   provide: RandomArtPaintingTypes.ItemMiddlewareChain,
   useFactory: (...middlewares) => new ItemMiddlewareChainExecutor(middlewares),
   inject: [
      Symbol('FileNameResolverMiddleware_0'),
      Symbol('ContentSizeFilterMiddleware_1'),
      Symbol('S3StorageHandlerMiddleware_2'),
   ]
}
```

### 3. Execution Flow

```
Worker receives context
  ↓
ItemMiddlewareChainExecutor.execute(ctx)
  ↓
For each middleware in chain:
  - Call middleware.handle(ctx)
  - If disposition !== OK, break
  ↓
Return final context
```

## Type Safety

The system provides full type safety through TypeScript generics:

1. **`ConstructorParameters<M>[0]`** - Ensures `valueParams` matches middleware's first parameter type
2. **`TokensForDependencies<M>`** - Extracts dependency types from positions 2+ in constructor
3. **`Type<MiddlewareHandler>`** - Ensures middleware implements the handler interface
4. **`MiddlewareHandler<TContext>`** - Generic interface where context type defaults to `any` but can be specialized

### Dependency Injection

All dependencies (Logger and any additional dependencies at positions 2+) are **mandatory parameters**, not optional:

```typescript
constructor(
   _params: Record<string, never>,
   private readonly logger: Logger,
   private readonly s3Store: IResultStore,
) {}
```

**Why mandatory instead of optional:**
- The DI framework **always** provides these dependencies
- Making them optional would require unnecessary runtime validation
- Making them optional would require defensive `=== undefined` checks to satisfy the linter
- Mandatory parameters are simpler, cleaner, and accurately reflect runtime behavior
- TypeScript automatically recognizes them as non-null (no assertions needed)

## Benefits

✅ **Zero boilerplate** - No manual token generation
✅ **Type-safe** - Config validated against actual constructor signatures
✅ **Debuggable** - Token names include class name and position
✅ **Testable** - Logger auto-injected but can be overridden in tests
✅ **Extensible** - Easy to add new middleware handlers
✅ **DI-friendly** - Leverages NestJS dependency injection fully
✅ **Order-preserving** - Middleware executes in array order

## Migration from Previous Design

**Before (manual tokens):**
```typescript
{
   injectToken: Symbol("S3Storage"),
   paramsToken: Symbol("S3StorageParams"),
   middlewareClass: S3StorageHandlerMiddleware,
   valueParams: {},
   inject: [MiddlewareDependencies.S3FileStore],
}
```

**After (auto-generated tokens):**
```typescript
{
   middlewareClass: S3StorageHandlerMiddleware,
   valueParams: {},
   inject: [MiddlewareDependencies.S3FileStore],
}
```

**Savings:** -2 lines per middleware, no token management overhead
