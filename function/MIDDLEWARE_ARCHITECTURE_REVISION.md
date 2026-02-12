# Middleware Architecture Revision

## Core Principles

1. **Every middleware can extend both Model AND Parser**
2. **Executor manages accumulated state** - middleware declares what it adds
3. **Expression middleware is model-agnostic** - depends only on Parser interface
4. **Type safety through compositional generics**

## MiddlewareHandler Interface

```typescript
/**
 * Middleware handler that can extend both the model and the parser.
 *
 * @template TAddedModel - Properties this middleware adds to the model
 * @template TAddedParser - Parser extension class (with static methods)
 */
export interface MiddlewareHandler<
   TAddedModel extends object = {},
   TAddedParser extends Type<any> | undefined = undefined
> {
   /**
    * Process the context.
    *
    * @param ctx - Current task context with accumulated model
    * @param parser - Current parser with accumulated extensions
    * @returns Result with model additions, optional parser extension, and disposition
    */
   handle(
      ctx: TaskContext,
      parser: Parser
   ): Promise<MiddlewareResult<TAddedModel, TAddedParser>>
}

/**
 * Result from middleware execution
 */
export interface MiddlewareResult<
   TAddedModel extends object,
   TAddedParser extends Type<any> | undefined
> {
   /**
    * Properties to add to the accumulated model
    */
   model: TAddedModel

   /**
    * Optional parser extension to add to accumulated parser
    */
   parserExtension?: TAddedParser

   /**
    * Job disposition
    */
   disposition: JobDisposition

   /**
    * Error (if disposition is not OK)
    */
   error?: Error
}
```

## Task Context Types

```typescript
/**
 * Base framework properties available to all tasks
 */
export interface CoreTaskContext {
   jobId: string
   pixels: ImageData
   buffer: Buffer
   disposition: JobDisposition
   error?: Error
}

/**
 * Single task with domain model
 */
export interface SingleTaskContext<TDomain = {}> extends CoreTaskContext {
   task: TDomain
}

/**
 * Multi-task with both task and project models
 */
export interface ProjectTaskContext<TTask = {}, TProject = {}>
   extends CoreTaskContext
{
   task: TTask
   project: TProject
}

/**
 * Generic task context (union of possible contexts)
 */
export type TaskContext =
   | CoreTaskContext
   | SingleTaskContext<any>
   | ProjectTaskContext<any, any>
```

## Parser Interface

```typescript
/**
 * Parser with accumulated extensions.
 *
 * The executor builds this by merging:
 * - Core built-in functions (hash, slice, etc.)
 * - All parser extensions from previous middleware
 */
export interface Parser {
   /**
    * Evaluate expression with current accumulated context.
    *
    * @param expression - JavaScript expression string
    * @param context - Full context object (model + framework properties)
    * @returns Evaluated result
    */
   evaluate<T>(expression: string, context: any): Promise<T>
}
```

## MiddlewareChainExecutor with State Accumulation

```typescript
export class MiddlewareChainExecutor<
   TInitialContext extends TaskContext,
   TFinalContext extends TaskContext = TInitialContext
> {
   constructor(
      private readonly middlewareChain: Array<MiddlewareHandler<any, any>>,
      private readonly expressionEvaluator: ExpressionEvaluator,
      logger?: Logger
   ) {}

   async execute(
      initialContext: TInitialContext
   ): Promise<TFinalContext> {
      let ctx: any = initialContext
      let parserExtensions: Array<Type<any>> = []

      for (let i = 0; i < this.middlewareChain.length; i++) {
         const middleware = this.middlewareChain[i]

         // Build current parser with all accumulated extensions
         const parser = this.buildParser(parserExtensions)

         // Execute middleware
         const result = await middleware.handle(ctx, parser)

         // Check disposition
         if (result.disposition !== JobDisposition.OK) {
            return {
               ...ctx,
               disposition: result.disposition,
               error: result.error
            }
         }

         // Accumulate model (merge new properties)
         ctx = {
            ...ctx,
            ...result.model
         }

         // Accumulate parser extensions
         if (result.parserExtension) {
            parserExtensions.push(result.parserExtension)
         }
      }

      return ctx
   }

   private buildParser(extensions: Array<Type<any>>): Parser {
      return {
         evaluate: <T>(expression: string, context: any) => {
            // Create memoizing wrapper that merges all extensions
            const mergedExtension = extensions.length > 0
               ? this.createMemoizingWrapper(extensions, context)
               : undefined

            return this.expressionEvaluator.evaluate<T>(
               expression,
               context,
               mergedExtension
            )
         }
      }
   }

   private createMemoizingWrapper(
      extensions: Array<Type<any>>,
      context: any
   ): any {
      // Use the transparent memoization wrapper pattern
      // Creates a delegate that:
      // 1. Binds all static methods to `this` (the wrapper instance)
      // 2. Memoizes results per expression evaluation
      // 3. Allows methods to call each other through `this`

      const cache = new Map<string, any>()
      const wrapper: any = { ...context }

      for (const extension of extensions) {
         const methods = Object.getOwnPropertyNames(extension)

         for (const name of methods) {
            if (name === 'constructor' || name === 'prototype') continue

            const method = extension[name]
            if (typeof method !== 'function') continue

            // Wrap with memoization
            wrapper[name] = (...args: any[]) => {
               const cacheKey = `${name}:${JSON.stringify(args)}`
               if (cache.has(cacheKey)) {
                  return cache.get(cacheKey)
               }

               // Call original method with wrapper as `this`
               const result = method.call(wrapper, ...args)
               cache.set(cacheKey, result)
               return result
            }
         }
      }

      return wrapper
   }
}
```

## Example Middleware Implementations

### 1. ColorAnalysisMiddleware - Adds Model + Parser

```typescript
interface ColorHistogram {
   dominantHue: string
   entropy: number
}

// Parser extension with static methods
class ImageMetricsExtension {
   static getDominantHue(this: TaskContext & { colorHistogram: ColorHistogram }): string {
      return this.colorHistogram.dominantHue
   }

   static getEntropy(this: TaskContext & { colorHistogram: ColorHistogram }): number {
      return this.colorHistogram.entropy
   }

   static isHighEntropy(this: TaskContext & { colorHistogram: ColorHistogram }): boolean {
      // Can call other methods through `this` - will be memoized
      return this.getEntropy() > 0.7
   }
}

class ColorAnalysisMiddleware implements MiddlewareHandler<
   { colorHistogram: ColorHistogram },  // Added model
   typeof ImageMetricsExtension         // Added parser
> {
   async handle(ctx: TaskContext, parser: Parser): Promise<MiddlewareResult<...>> {
      const colorHistogram = await analyzeColors(ctx.buffer)

      return {
         model: { colorHistogram },
         parserExtension: ImageMetricsExtension,
         disposition: JobDisposition.OK
      }
   }
}
```

### 2. NameByMiddleware - Model-Agnostic Expression Evaluator

```typescript
class NameByMiddleware<PropName extends string> implements MiddlewareHandler<
   ByNameValue<PropName>,  // Adds dynamic property (e.g., { s3Path: string })
   undefined                // No parser extension
> {
   constructor(
      private readonly expression: string,
      private readonly outputProperty: PropName
   ) {}

   async handle(
      ctx: TaskContext,
      parser: Parser  // Uses accumulated parser (model-agnostic!)
   ): Promise<MiddlewareResult<ByNameValue<PropName>, undefined>> {
      // Evaluate with accumulated parser (has all extensions)
      const filename = await parser.evaluate<string>(this.expression, ctx)

      return {
         model: { [this.outputProperty]: filename } as ByNameValue<PropName>,
         disposition: JobDisposition.OK
      }
   }
}
```

### 3. GroupByMiddleware - Similar Pattern

```typescript
class GroupByMiddleware<PropName extends string> implements MiddlewareHandler<
   ByNameValue<PropName>,
   undefined
> {
   constructor(
      private readonly expression: string,
      private readonly outputProperty: PropName
   ) {}

   async handle(ctx: TaskContext, parser: Parser) {
      const groupId = await parser.evaluate<string>(this.expression, ctx)

      return {
         model: { [this.outputProperty]: groupId } as ByNameValue<PropName>,
         disposition: JobDisposition.OK
      }
   }
}
```

### 4. FilterByMiddleware - Boolean Expression

```typescript
class FilterByMiddleware implements MiddlewareHandler<{}, undefined> {
   constructor(private readonly expression: string) {}

   async handle(ctx: TaskContext, parser: Parser) {
      const passes = await parser.evaluate<boolean>(this.expression, ctx)

      if (!passes) {
         return {
            model: {},
            disposition: JobDisposition.SEMANTIC_ERROR,
            error: new Error(`Filtered: ${this.expression} = false`)
         }
      }

      return {
         model: {},
         disposition: JobDisposition.OK
      }
   }
}
```

## Type-Safe Chain Composition

```typescript
// TypeScript infers the accumulated type through the chain
const chain = [
   new RenderMiddleware(),  // Adds: { buffer: Buffer }

   new ColorAnalysisMiddleware(),  // Adds: { colorHistogram }
   // Parser now has: ImageMetricsExtension

   new FilterByMiddleware(
      "isHighEntropy()"  // ✓ Uses ImageMetricsExtension
   ),

   new NameByMiddleware(
      "${getDominantHue()}/${task.variant}.png",  // ✓ Uses extension + task
      "s3Path"
   ),  // Adds: { s3Path: string }

   new FileStoreMiddleware({
      pathProperty: "s3Path",  // ✓ TypeScript knows this exists
      uriProperty: "s3Uri"
   }, s3FileStore)  // Adds: { s3Uri: string }
]

// Type inference:
// After RenderMiddleware: CoreContext & { buffer }
// After ColorAnalysis: CoreContext & { buffer, colorHistogram }
// After FilterBy: (same)
// After NameBy: CoreContext & { buffer, colorHistogram, s3Path }
// After FileStore: CoreContext & { buffer, colorHistogram, s3Path, s3Uri }
```

## Benefits

1. **Model-Agnostic Expression Middleware** - NameBy/GroupBy/FilterBy don't know about domain models
2. **Type-Safe Accumulation** - Parser extensions accumulate correctly
3. **Transparent Memoization** - Extension methods can call each other without re-computation
4. **Clear Separation** - Middleware declares what it adds, executor manages state
5. **Compositional** - Easy to add new middleware without changing existing ones

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
      expression: string,
      outputProperty: PropName
      // ✓ No evaluator, no parser extension - model agnostic!
   ) {}

   async handle(ctx: TaskContext, parser: Parser) {
      // ✓ Uses whatever parser executor provides
   }
}
```

---

## Implementation Status

**Status**: ✅ Core implementation complete
**Last Updated**: 2026-01-08

### Completed
- ✅ Updated MiddlewareConfigTypes.ts with Parser, MiddlewareResult, MiddlewareHandler interfaces
- ✅ Updated MiddlewareChainExecutor with parser accumulation and memoization wrapper
- ✅ Refactored NameByMiddleware to use Parser parameter and ByNameValue<PropName>
- ✅ Refactored GroupByMiddleware to use Parser parameter and ByNameValue<PropName>
- ✅ Refactored FilterByMiddleware to use Parser parameter
- ✅ All expression middleware now model-agnostic

### Pending
- ⏳ Update FileStoreMiddleware to use new interface
- ⏳ Update legacy middleware (S3StorageHandler, LocalStorageHandler, etc.)
- ⏳ Update MiddlewareChainExecutor instantiation sites to inject ExpressionEvaluator
- ⏳ Create example parser extension (e.g., ImageMetricsExtension for color analysis)
- ⏳ Integration testing with full middleware chains
