import { Logger, Type } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { Parser } from "../expression/Parser.js"
import { ItemContext } from "../types/ItemContext.js"
import {
   JobDisposition,
   isMiddlewareThrowable,
} from "../types/JobDisposition.js"
import { ExpressionEvaluator } from "../expression/ExpressionEvaluator.js"

/**
 * Minimum context interface required by the executor.
 * Both ItemContext and CollectionContext satisfy this.
 */
interface ExecutableContext {
   disposition: JobDisposition
   error?: Error
   jobId?: string
}

/**
 * Executes a chain of middleware handlers sequentially.
 *
 * Manages accumulated model and parser extensions through the chain.
 * Chain terminates on first non-OK disposition.
 */
export class MiddlewareChainExecutor<
   TContext extends ExecutableContext = ItemContext,
> {
   private readonly logger: Logger

   constructor(
      private readonly middlewareChain: Array<MiddlewareHandler<any, any>>,
      private readonly expressionEvaluator: ExpressionEvaluator,
      logger?: Logger,
   ) {
      this.logger = logger ?? new Logger(this.constructor.name)
   }

   /**
    * Execute the middleware chain on the given context.
    *
    * Accumulates model properties and parser extensions through the chain.
    *
    * @param initialContext Starting context
    * @returns Final context after chain execution
    */
   async execute(initialContext: TContext): Promise<TContext> {
      let ctx: any = initialContext
      const parserExtensions: Array<Type<any>> = []

      for (let i = 0; i < this.middlewareChain.length; i++) {
         const middleware = this.middlewareChain[i]
         const middlewareName = middleware.constructor.name

         this.logger.debug(`Executing middleware ${i}: ${middlewareName}`)

         try {
            // Build current parser with all accumulated extensions
            const parser = this.buildParser(parserExtensions)

            // Execute middleware with current parser
            const result = await middleware.handle(ctx, parser)

            // Check disposition
            switch (true) {
               // case isMiddlewareThrowable(result.disposition): {
               case result.disposition === JobDisposition.FATAL_ERROR ||
                  result.disposition === JobDisposition.SEMANTIC_ERROR ||
                  result.disposition === JobDisposition.TRANSIENT_ERROR: {
                  this.logger.warn(
                     `Middleware ${middlewareName} set disposition to ${result.disposition}`,
                     { error: result.error.message, jobId: ctx.jobId },
                  )

                  ctx = {
                     ...ctx,
                     disposition: result.disposition,
                     error: result.error,
                  }
                  break
               }
               case result.disposition === JobDisposition.OK: {
                  // Accumulate parser extensions
                  if (result.parserExtension !== null) {
                     this.logger.debug(
                        `Middleware ${middlewareName} added parser extension`,
                     )
                  }

                  // Accumulate model (merge new properties)
                  ctx = {
                     ...ctx,
                     model: result.model,
                     parserExtensions:
                        result.parserExtension !== null
                           ? [result.parserExtension]
                           : [],
                  }
                  break
               }
               case result.disposition === JobDisposition.IGNORE: {
                  const jobId: string = ctx.jobId
                  this.logger.debug(
                     `Middleware ${middlewareName} ignored ${jobId}`,
                  )
                  ctx = { ...ctx, disposition: JobDisposition.IGNORE }
                  break
               }
               default: {
                  ctx = null as never
               }
            }
         } catch (error) {
            this.logger.error(
               `Middleware ${middlewareName} threw an unhandled error`,
               (error as Error).stack,
            )

            // Middleware should handle its own errors and set disposition
            // But if it throws, treat as unhandled transient error
            return {
               ...ctx,
               disposition: JobDisposition.TRANSIENT_ERROR,
               error: error as Error,
            }
         }
      }

      return ctx
   }

   /**
    * Build a Parser interface with accumulated extensions.
    *
    * @param extensions Array of parser extension classes
    * @returns Parser interface
    */
   private buildParser(extensions: Array<Type<any>>): Parser {
      return {
         evaluate: async <T>(expression: string, evalContext: any) => {
            // Create memoizing wrapper that merges all extensions
            const mergedExtension =
               extensions.length > 0
                  ? this.createMemoizingWrapper(extensions, evalContext)
                  : undefined

            return await this.expressionEvaluator.evaluate<T>(
               expression,
               evalContext,
               mergedExtension,
            )
         },
      }
   }

   /**
    * Create a transparent memoization wrapper for parser extensions.
    *
    * Following the CandyCaneWrapper pattern:
    * 1. Binds all static methods to `this` (the wrapper instance)
    * 2. Memoizes results per expression evaluation
    * 3. Allows methods to call each other through `this`
    *
    * @param extensions Array of parser extension classes
    * @param context Current context to merge into wrapper
    * @returns Wrapper object with memoized methods
    */
   private createMemoizingWrapper(
      extensions: Array<Type<any>>,
      context: any,
   ): any {
      const cache = new Map<string, any>()
      const wrapper: any = { ...context }

      for (const extension of extensions) {
         const methods = Object.getOwnPropertyNames(extension)

         for (const name of methods) {
            if (name === "constructor" || name === "prototype") continue

            const method = extension[name as keyof typeof extension]
            if (typeof method !== "function") continue

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
