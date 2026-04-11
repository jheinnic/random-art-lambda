import { Injectable, Logger } from "@nestjs/common"
import { compileAsync } from "jse-eval"
import { BuiltInFunctions } from "./BuiltInFunctions.js"

/**
 * Interface for expression evaluators.
 */
export interface ExpressionEvaluator {
   eval(expression: string, context: Record<string, any>): Promise<string>
}

/**
 * Expression evaluator using jse-eval for safe JavaScript expression evaluation.
 *
 * Evaluates JavaScript expressions with access to context variables and built-in functions.
 *
 * Uses jse-eval which provides safer evaluation than Function constructor by:
 * - Restricting access to global scope
 * - Preventing prototype pollution
 * - Using AST-based evaluation instead of eval()
 * - Sandboxing dangerous operations
 *
 * Expressions are compiled once and cached for performance when evaluating
 * the same expression multiple times with different contexts.
 *
 * Expressions have access to:
 * - All context properties as variables (e.g., `buffer`, `metadata`, `customData`)
 * - Built-in functions: contentHash, asUtf8, trim, fileSize, regionMapName, custom, etc.
 * - Custom functions provided by the application
 *
 * @example
 * // Simple property access
 * await eval("metadata.width", ctx)  // "1024"
 *
 * // Built-in functions
 * await eval("contentHash(12)", ctx)  // "XyZ_AbC12..."
 *
 * // Template strings
 * await eval("`img_${imageIndex()}_${contentHash(8)}.png`", ctx)
 *
 * // Complex expressions
 * await eval("imageIndex() < 10 ? `0${imageIndex()}` : `${imageIndex()}`", ctx)
 */
@Injectable()
export class SimpleExpressionEvaluator implements ExpressionEvaluator {
   private readonly logger = new Logger(SimpleExpressionEvaluator.name)
   private readonly compiledCache = new Map<
      string,
      (context?: Record<string, any>) => Promise<unknown>
   >()

   /**
    * Evaluate an expression with the given context.
    *
    * @param expression - JavaScript expression to evaluate
    * @param context - Context object with variables and functions
    * @returns Evaluated result as string
    * @throws Error if evaluation fails
    */
   async eval(
      expression: string,
      context: Record<string, any>,
   ): Promise<string> {
      try {
         this.logger.debug(`Evaluating expression: ${expression}`)

         // Get built-in function names
         const builtInNames = Object.getOwnPropertyNames(
            BuiltInFunctions,
         ).filter(
            (name) =>
               name !== "constructor" &&
               name !== "prototype" &&
               name !== "length" &&
               name !== "name",
         )

         // Create bound built-in functions (bind to context for `this` access)
         const builtInFunctions = builtInNames.reduce<Record<string, any>>(
            (acc, name) => {
               const fn = (BuiltInFunctions as any)[name]
               if (typeof fn === "function") {
                  acc[name] = fn.bind(context)
               }
               return acc
            },
            {},
         )

         // Combine context variables with built-in functions
         const scope = {
            ...context,
            ...builtInFunctions,
         }

         // Get or compile the expression
         let compiledFn = this.compiledCache.get(expression)
         if (compiledFn === undefined) {
            this.logger.debug(`Compiling expression: ${expression}`)
            compiledFn = compileAsync(expression)
            this.compiledCache.set(expression, compiledFn)
         }

         // Evaluate compiled expression with scope
         const result = await compiledFn(scope)

         // Convert result to string
         const stringResult = String(result)
         this.logger.debug(`Expression result: ${stringResult}`)

         return stringResult
      } catch (error) {
         this.logger.error(
            `Failed to evaluate expression: ${expression}`,
            (error as Error).stack,
         )
         throw new Error(
            `Expression evaluation failed: ${(error as Error).message}`,
            { cause: error },
         )
      }
   }
}
