import { Injectable, Logger } from "@nestjs/common"
import jseEval from "jse-eval"
import templatePlugin from "@jsep-plugin/template"
import * as crypto from "crypto"

// Register template literal plugin for jse-eval
jseEval.registerPlugin(templatePlugin)

/**
 * Service for evaluating JavaScript expressions in a sandboxed context.
 *
 * Supports template literals (e.g., `${variable}`) via @jsep-plugin/template
 * Provides built-in core functions (hash, slice, etc.) and supports
 * custom parser extensions.
 */
@Injectable()
export class ExpressionEvaluator {
   private readonly logger = new Logger(ExpressionEvaluator.name)

   /**
    * Evaluate an expression against a context object.
    *
    * @param expression - JavaScript expression string (e.g., "${task.campaign}/${hash(buffer).slice(0,12)}.png")
    * @param context - Context object with properties accessible in expression
    * @param parserExtension - Optional class with static methods to add to context
    * @returns Evaluated result
    */
   async evaluate<T = any>(
      expression: string,
      context: any,
      parserExtension?: any,
   ): Promise<T> {
      this.logger.debug(`Evaluating expression: ${expression}`)

      // Build evaluation context with core functions
      const evalContext = {
         ...context,
         ...this.buildCoreFunctions(),
      }

      // Add parser extension methods if provided
      if (parserExtension != null) {
         const methods = this.extractStaticMethods(parserExtension)
         Object.assign(evalContext, methods)
      }

      try {
         // Use jse-eval's evalExprAsync for safe expression evaluation
         // This supports template strings and async evaluation
         const result = (await jseEval.evalExprAsync(
            expression,
            evalContext,
         )) as T

         this.logger.debug(`Expression evaluated to: ${String(result)}`)
         return result
      } catch (error) {
         this.logger.error(
            `Failed to evaluate expression: ${expression}`,
            (error as Error).stack,
         )
         throw new Error(
            `Expression evaluation failed: ${(error as Error).message}`,
         )
      }
   }

   /**
    * Build core functions available to all expressions.
    */
   private buildCoreFunctions(): Record<string, Function> {
      return {
         // Content hashing function
         hash: (data: Buffer) => {
            return crypto.createHash("sha256").update(data).digest("hex")
         },

         // String slice function (already available on String prototype, but explicit is clearer)
         slice: (str: string, start: number, end?: number) => {
            return str.slice(start, end)
         },

         // Buffer/string length
         length: (data: Buffer | string) => {
            return data.length
         },

         // Array access (for dereferencing project arrays)
         get: (obj: any, key: string | number) => {
            return obj[key]
         },
      }
   }

   /**
    * Extract static methods from a parser extension class.
    *
    * @param extensionClass - Class with static methods
    * @returns Object with methods bound to context
    */
   private extractStaticMethods(extensionClass: any): Record<string, Function> {
      const methods: Record<string, Function> = {}

      // Get all static method names
      const propNames = Object.getOwnPropertyNames(extensionClass)

      for (const name of propNames) {
         // Skip constructor and non-function properties
         if (name === "constructor" || name === "prototype") continue

         const prop = extensionClass[name]
         if (typeof prop === "function") {
            // Bind the static method
            methods[name] = prop
         }
      }

      return methods
   }
}
