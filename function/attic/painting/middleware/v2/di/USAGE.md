# Middleware Configuration System

## Overview

This system provides declarative configuration for middleware chains with automatic dependency injection via NestJS.

## Key Concepts

### 1. Middleware Props

Each middleware handler in a chain is configured via `MiddlewareProps<M>`:

```typescript
interface MiddlewareProps<M extends MiddlewareHandler> {
   injectToken: symbol | string        // Unique token for this instance
   paramsToken: symbol | string        // Unique token for value params
   middlewareClass: Type<M>            // Class to instantiate
   valueParams: ConstructorParameters<M>[0]  // First constructor arg
   inject?: TokensForDependencies<M>   // Remaining constructor dependencies
}
```

### 2. Constructor Convention

All middleware handlers must follow this constructor pattern:

```typescript
class MyMiddleware implements MiddlewareHandler {
   constructor(
      private params: MyParamsType,     // Value object (required)
      private dependency?: IDependency  // Injectable dependencies (optional)
   ) {}
}
```

**First argument**: Value object with configuration data
**Remaining arguments**: Injectable dependencies from NestJS container

### 3. Dependency Injection

Dependencies are resolved from the module's import tokens:

```typescript
const MiddlewareDependencies = {
   S3FileStore: Symbol("FileStore<S3>"),
   LocalFileStore: Symbol("FileStore<Local>"),
   ExpressionAddons: Symbol("ExpressionContextAddons"),
   BufferCache: Symbol("BufferCache"),
} as const
```

These tokens are bound when creating the module via `InjectableModuleClassFactory`.

## Usage Example

### 1. Define Middleware Configuration

```typescript
const config: MiddlewareConfig = {
   itemChain: [
      {
         injectToken: Symbol("FileNameResolver"),
         paramsToken: Symbol("FileNameResolverParams"),
         middlewareClass: FileNameResolverMiddleware,
         valueParams: {
            // Config data here
         },
         inject: [MiddlewareDependencies.ExpressionAddons],
      },

      {
         injectToken: Symbol("S3Storage"),
         paramsToken: Symbol("S3StorageParams"),
         middlewareClass: S3StorageHandlerMiddleware,
         valueParams: {},
         inject: [MiddlewareDependencies.S3FileStore],
      },
   ],

   collectionChain: [
      // Collection-level middleware
   ],
}
```

### 2. Create Dynamic Module

```typescript
import { MiddlewareModuleFactory } from './config/MiddlewareModuleFactory'
import { exampleMiddlewareConfig } from './config/ExampleMiddlewareConfig'

const MiddlewareModule = MiddlewareModuleFactory.importConfig(
   exampleMiddlewareConfig
)
```

### 3. Import into Application Module

```typescript
@Module({
   imports: [
      MiddlewareModule.importDependencies({
         [MiddlewareDependencies.S3FileStore]: S3StorageModule.S3_RESULT_STORE,
         [MiddlewareDependencies.LocalFileStore]: LocalStorageModule.LOCAL_RESULT_STORE,
         [MiddlewareDependencies.ExpressionAddons]: ExpressionModule.EXPRESSION_EVALUATOR,
      }),
   ],
})
export class RandomArtModule {}
```

### 4. Inject Chain Executors

```typescript
@Injectable()
export class PaintingWorker {
   constructor(
      @Inject(RandomArtPaintingTypes.ItemMiddlewareChain)
      private itemChain: ItemMiddlewareChainExecutor,

      @Inject(RandomArtPaintingTypes.CollectionMiddlewareChain)
      private collectionChain: CollectionMiddlewareChainExecutor,
   ) {}
}
```

## Benefits

1. **Type Safety**: TypeScript ensures middleware configs match constructor signatures
2. **Declarative**: Chain order and configuration in one place
3. **Testable**: Easy to create test configs with mock dependencies
4. **Reusable**: Same middleware can be used with different configs
5. **DI Integration**: Leverages NestJS dependency injection
6. **No Hand-Wiring**: Factory generates all provider bindings

## Advanced: Custom Business Logic Middleware

For pure business logic without dependencies:

```typescript
class MyCustomFilter implements MiddlewareHandler {
   constructor(private params: { threshold: number }) {}

   async handle(ctx: ItemExecutionContext): Promise<ItemExecutionContext> {
      // Pure logic, no external dependencies
      if (ctx.customData.score < this.params.threshold) {
         return { ...ctx, disposition: JobDisposition.IGNORE }
      }
      return ctx
   }
}

// Configuration
{
   injectToken: Symbol("CustomFilter"),
   paramsToken: Symbol("CustomFilterParams"),
   middlewareClass: MyCustomFilter,
   valueParams: { threshold: 0.5 },
   // No inject - only params
}
```

## Execution Flow

1. Factory creates providers for each middleware handler
2. Factory creates providers for value params objects
3. Factory creates chain executors that receive ordered middleware array
4. NestJS resolves dependencies and instantiates everything
5. Workers receive fully-wired chain executors via DI
6. Chain executors call `handle()` on each middleware in sequence
7. First non-OK disposition terminates the chain

## Chain Execution Order

Middleware executes in array order. Example:

```typescript
itemChain: [
   FileNameResolver,     // Step 1: Resolve filename
   ContentSizeFilter,    // Step 2: Check size (may IGNORE)
   S3Storage,           // Step 3: Save to S3 (if not IGNORED)
   LocalStorage,        // Step 4: Save locally (if not IGNORED)
]
```

If ContentSizeFilter sets `disposition: IGNORE`, S3Storage and LocalStorage never execute.
