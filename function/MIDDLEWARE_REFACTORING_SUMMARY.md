# Middleware Architecture Refactoring - Implementation Summary

**Date**: 2026-01-08
**Status**: ✅ Core implementation complete

## Overview

Successfully implemented the revised MiddlewareHandler architecture where middleware can extend both the model and the parser, with the executor managing accumulated state. This makes expression-based middleware completely model-agnostic while maintaining type safety.

## Key Changes

### 1. Updated Core Interfaces ([src/painting/middleware/config/MiddlewareConfigTypes.ts](src/painting/middleware/config/MiddlewareConfigTypes.ts))

#### Parser Interface
```typescript
export interface Parser {
   evaluate<T>(expression: string, context: any): Promise<T>
}
```
- Abstraction for expression evaluation
- Hides ExpressionEvaluator implementation details
- Accumulated extensions are transparent to middleware

#### MiddlewareResult Interface
```typescript
export interface MiddlewareResult<
   TAddedModel extends object,
   TAddedParser extends Type<any> | undefined
> {
   model: TAddedModel
   parserExtension?: TAddedParser
   disposition: JobDisposition
   error?: Error
}
```
- Declares what the middleware contributes
- Separate model and parser extension types
- Clear disposition and error handling

#### MiddlewareHandler Interface
```typescript
export interface MiddlewareHandler<
   TAddedModel extends object = {},
   TAddedParser extends Type<any> | undefined = undefined
> {
   handle(
      ctx: any,
      parser: Parser
   ): Promise<MiddlewareResult<TAddedModel, TAddedParser>>
}
```
- Receives context and parser as parameters
- Returns result declaring contributions
- Generic types for type-safe accumulation

### 2. Updated MiddlewareChainExecutor ([src/painting/middleware/base/MiddlewareChainExecutor.ts](src/painting/middleware/base/MiddlewareChainExecutor.ts))

#### Parser Accumulation
- Maintains array of parser extensions
- Builds Parser interface for each middleware
- Implements transparent memoization wrapper

#### Memoization Wrapper
```typescript
private createMemoizingWrapper(
   extensions: Array<Type<any>>,
   context: any
): any {
   const cache = new Map<string, any>()
   const wrapper: any = { ...context }

   for (const extension of extensions) {
      // Extract static methods
      // Wrap with memoization
      // Methods can call each other through `this`
   }

   return wrapper
}
```
- Follows CandyCaneWrapper pattern from user
- Binds static methods to wrapper instance
- Caches results per expression evaluation
- Enables cross-method calls with memoization

#### Model Accumulation
```typescript
// Accumulate model (merge new properties)
ctx = {
   ...ctx,
   ...result.model,
}

// Accumulate parser extensions
if (result.parserExtension !== undefined) {
   parserExtensions.push(result.parserExtension)
}
```

### 3. Refactored Expression Middleware

All expression middleware now:
- Accept Parser parameter (not ExpressionEvaluator)
- Use ByNameValue<PropName> for type-safe property names
- Return MiddlewareResult with model contributions
- Are completely model-agnostic

#### NameByMiddleware ([src/painting/middleware/handlers/NameByMiddleware.ts](src/painting/middleware/handlers/NameByMiddleware.ts))
```typescript
export class NameByMiddleware<PropName extends string>
   implements MiddlewareHandler<ByNameValue<PropName>, undefined>
{
   constructor(
      private readonly params: {
         expression: string
         outputProperty: PropName
      },
      logger?: Logger
   ) {}

   async handle(
      ctx: any,
      parser: Parser
   ): Promise<MiddlewareResult<ByNameValue<PropName>, undefined>> {
      const filename = await parser.evaluate<string>(
         this.params.expression,
         ctx
      )

      return {
         model: { [this.params.outputProperty]: filename } as ByNameValue<PropName>,
         disposition: JobDisposition.OK
      }
   }
}
```

#### GroupByMiddleware ([src/painting/middleware/handlers/GroupByMiddleware.ts](src/painting/middleware/handlers/GroupByMiddleware.ts))
- Same pattern as NameByMiddleware
- Evaluates groupBy expression for aggregation
- Type-safe output property

#### FilterByMiddleware ([src/painting/middleware/handlers/FilterByMiddleware.ts](src/painting/middleware/handlers/FilterByMiddleware.ts))
```typescript
export class FilterByMiddleware implements MiddlewareHandler<{}, undefined> {
   async handle(
      ctx: any,
      parser: Parser
   ): Promise<MiddlewareResult<{}, undefined>> {
      const passesFilter = await parser.evaluate<boolean>(
         this.params.expression,
         ctx
      )

      if (!passesFilter) {
         return {
            model: {},
            disposition: JobDisposition.SEMANTIC_ERROR,
            error: new Error(`Filtered out: ${this.params.expression} evaluated to false`)
         }
      }

      return {
         model: {},
         disposition: JobDisposition.OK
      }
   }
}
```

### 4. Updated FileStoreMiddleware ([src/painting/middleware/handlers/FileStoreMiddleware.ts](src/painting/middleware/handlers/FileStoreMiddleware.ts))

```typescript
export class FileStoreMiddleware<UriPropName extends string>
   implements MiddlewareHandler<ByNameValue<UriPropName>, undefined>
{
   async handle(
      ctx: any,
      _parser: Parser
   ): Promise<MiddlewareResult<ByNameValue<UriPropName>, undefined>> {
      const filename = ctx[this.params.pathProperty] as string | undefined

      const uri = await this.fileStore.write(filename, ctx.buffer, {
         contentType: this.params.contentType
      })

      return {
         model: { [this.params.uriProperty]: uri } as ByNameValue<UriPropName>,
         disposition: JobDisposition.OK
      }
   }
}
```

## Benefits Achieved

### 1. Model-Agnostic Expression Middleware
- NameBy/GroupBy/FilterBy don't know about domain models
- Only depend on Parser interface
- Work with any accumulated context

### 2. Type-Safe Property Names
- ByNameValue<PropName> ensures property name correctness
- Better than Record<string, string>
- Type inference through chain composition

### 3. Clear Separation of Concerns
- Middleware declares what it adds (TAddedModel, TAddedParser)
- Executor manages accumulated state
- Parser extensions flow through the chain

### 4. Transparent Memoization
- Extension methods can call each other
- No redundant computation
- Automatic caching per expression evaluation

### 5. Compositional Type Safety
```typescript
const chain = [
   new ColorAnalysisMiddleware(),  // Adds: { colorHistogram }, Parser: ImageMetricsExtension
   new FilterByMiddleware("isHighEntropy()"),  // Uses: ImageMetricsExtension
   new NameByMiddleware("${getDominantHue()}/${task.variant}.png", "s3Path"),  // Uses: extension + task
   new FileStoreMiddleware({ pathProperty: "s3Path", uriProperty: "s3Uri" }, s3Store)  // Uses: s3Path
]
```

Type inference:
- After ColorAnalysis: `CoreContext & { colorHistogram }`, Parser has `ImageMetricsExtension`
- After Filter: (same)
- After NameBy: `CoreContext & { colorHistogram, s3Path }`
- After FileStore: `CoreContext & { colorHistogram, s3Path, s3Uri }`

## Migration Path

### Old Approach
```typescript
class NameByMiddleware {
   constructor(
      expression: string,
      outputProperty: string,
      evaluator: ExpressionEvaluator,
      parserExtension?: any  // ❌ Coupled to specific extension
   ) {}
}
```

### New Approach
```typescript
class NameByMiddleware<PropName extends string> {
   constructor(
      params: {
         expression: string
         outputProperty: PropName
      }
      // ✓ No evaluator, no parser extension - model agnostic!
   ) {}

   async handle(ctx: any, parser: Parser) {
      // ✓ Uses whatever parser executor provides
   }
}
```

## Next Steps

### Immediate
1. Update MiddlewareChainExecutor instantiation sites to inject ExpressionEvaluator
2. Create example parser extension (e.g., ImageMetricsExtension)
3. Update legacy middleware (S3StorageHandler, LocalStorageHandler)

### Future
1. Define worker preset configurations
2. Update configuration system to specify parser extensions
3. Create dynamic module factory for chain building
4. Integration testing with full chains

## Files Modified

### Core Types
- [src/painting/middleware/config/MiddlewareConfigTypes.ts](src/painting/middleware/config/MiddlewareConfigTypes.ts)

### Executor
- [src/painting/middleware/base/MiddlewareChainExecutor.ts](src/painting/middleware/base/MiddlewareChainExecutor.ts)

### Expression Middleware
- [src/painting/middleware/handlers/NameByMiddleware.ts](src/painting/middleware/handlers/NameByMiddleware.ts)
- [src/painting/middleware/handlers/GroupByMiddleware.ts](src/painting/middleware/handlers/GroupByMiddleware.ts)
- [src/painting/middleware/handlers/FilterByMiddleware.ts](src/painting/middleware/handlers/FilterByMiddleware.ts)

### Storage Middleware
- [src/painting/middleware/handlers/FileStoreMiddleware.ts](src/painting/middleware/handlers/FileStoreMiddleware.ts)

### Documentation
- [MIDDLEWARE_ARCHITECTURE_REVISION.md](MIDDLEWARE_ARCHITECTURE_REVISION.md)
- This summary document

## Build Status

✅ TypeScript compilation clean for all updated files
- No new errors introduced
- Type inference working correctly
- All linting rules satisfied

## Testing Recommendations

1. **Unit Tests**: Test each middleware in isolation with mock Parser
2. **Integration Tests**: Test full chains with real ExpressionEvaluator
3. **Parser Extension Tests**: Verify memoization and cross-method calls
4. **Type Tests**: Verify type inference through chain composition

## References

- User-provided CandyCaneWrapper pattern for transparent memoization
- ByNameValue type from [src/painting/messages/values/ByNameValue.ts](src/painting/messages/values/ByNameValue.ts)
- ParserExtension type from [src/painting/artwork/di/Configuration.ts](src/painting/artwork/di/Configuration.ts)
