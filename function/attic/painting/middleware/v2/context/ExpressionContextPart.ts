/**
 * Expression-Backed Context Part
 *
 * Utilities for creating context parts where property values or method results
 * are derived from expression evaluation against the accumulated context.
 *
 * Key concepts:
 * - ExpressionContextPart computes values from expressions
 * - Expressions have access to `context` (public state) and `_methods` (callable methods)
 * - This is used for derived values like path naming, computed identifiers, etc.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
   EXPRESSION_METHOD,
   METHODS,
   type ContextPartOptions,
   type ContextPartConstructor,
   type ExpressionMethodMetadata,
} from "./ContextPartMetadata.js"
import {
   publicContextualize,
   applyContextPartMetadata,
   type MiddlewareContextConstructor,
} from "./Contextualize.js"

// ============================================================================
// Expression Types
// ============================================================================

/**
 * The context available to expressions at evaluation time.
 * This mirrors the shape of a MiddlewareContext.
 */
export interface ExpressionContext {
   /** Public state from all assembled parts */
   readonly context: Record<string, unknown>
   /** Method references from all assembled parts */
   readonly _methods: Record<string, (...args: unknown[]) => unknown>
}

/**
 * An expression that can be evaluated against the context.
 * Can be a string (for parsing) or a function (for direct evaluation).
 */
export type ContextExpression<T = unknown> =
   | string
   | ((ctx: ExpressionContext) => T)

/**
 * Descriptor for an expression-backed property or method
 */
export interface ExpressionDescriptor<T = unknown> {
   /** The property/method name on the context part */
   readonly propertyKey: string
   /** The expression to evaluate */
   readonly expression: ContextExpression<T>
   /** Whether this is a method (true) or property (false) */
   readonly isMethod: boolean
   /** Optional: parameters names if this is a method */
   readonly parameterNames?: string[]
}

/**
 * Options for creating an expression-backed context part
 */
export interface ExpressionPartOptions<K extends object>
   extends ContextPartOptions {
   /**
    * Map of property names to expressions.
    * These will be evaluated against the accumulated context at runtime.
    */
   readonly expressions: {
      [P in keyof K]?: ContextExpression<K[P]>
   }
}

/**
 * Extended expression metadata that stores the compiled function
 * (internally used, while ExpressionMethodMetadata uses string expressions)
 */
export interface ExtendedExpressionMetadata {
   readonly methodName: string
   readonly expression: string
   readonly contextFields: string[]
   /** Compiled expression function for direct evaluation */
   readonly expressionFn?: (ctx: ExpressionContext) => unknown
}

/**
 * Symbol for storing extended expression metadata
 */
export const EXTENDED_EXPR_META: unique symbol = Symbol("ExtendedExprMeta")

// ============================================================================
// Expression Context Part Factory
// ============================================================================

/**
 * Creates a context part where values are derived from expressions.
 *
 * This is used for concrete providers that compute values based on
 * the accumulated context rather than injected services.
 *
 * @typeParam K - The shape of the properties this part provides
 * @param abstractContract - The abstract class this part provides
 * @param options - Configuration including expression definitions
 * @returns A MiddlewareContextConstructor that evaluates expressions at runtime
 *
 * @example
 * ```typescript
 * // Abstract contract
 * @ContextPart({ isAbstract: true, visibility: "public" })
 * abstract class HasPathName {
 *    abstract readonly pathName: string
 * }
 *
 * // Concrete provider using expressions
 * const ExpressionPathNamePart = createExpressionPart<{ pathName: string }>(
 *    HasPathName,
 *    {
 *       name: "ExpressionPathNamePart",
 *       provides: [HasPathName],
 *       expressions: {
 *          pathName: (ctx) => `${ctx.context.projectId}/${ctx.context.taskId}.png`,
 *       },
 *    }
 * )
 * ```
 */
export function createExpressionPart<K extends object>(
   abstractContract: ContextPartConstructor,
   options: ExpressionPartOptions<K>,
): MiddlewareContextConstructor<K, object> {
   // Build expression metadata from options
   const expressionEntries = Object.entries(options.expressions) as Array<
      [string, ContextExpression<unknown>]
   >

   // Build standard metadata (for @ExpressionMethod decorator compatibility)
   const expressionMeta: ExpressionMethodMetadata[] = expressionEntries.map(
      ([methodName, expression]) => ({
         methodName,
         expression: typeof expression === "string" ? expression : "[function]",
         contextFields: [], // Will be computed from expression if string
      }),
   )

   // Build extended metadata with compiled functions
   const extendedMeta: ExtendedExpressionMetadata[] = expressionEntries.map(
      ([methodName, expression]) => ({
         methodName,
         expression: typeof expression === "string" ? expression : "[function]",
         contextFields: [],
         expressionFn: typeof expression === "function" ? expression : undefined,
      }),
   )

   // Build method names from expressions (those that look like method definitions)
   const methodNames: string[] = []
   const propertyNames: string[] = []

   for (const [propertyKey] of expressionEntries) {
      // For now, treat all expressions as properties
      // Methods would require more complex setup
      propertyNames.push(propertyKey)
   }

   // Create the contextualized class
   const RetVal = class ExpressionPart {
      readonly context: Record<string, unknown>
      readonly _context: object
      readonly _methods: Record<string, Function>
      static readonly [METHODS]: string[] = methodNames
      static readonly [EXPRESSION_METHOD]: ExpressionMethodMetadata[] =
         expressionMeta

      // Internal: Store expression functions for evaluation
      private static readonly _expressions: Map<
         string,
         ContextExpression<unknown>
      > = new Map(expressionEntries)

      constructor(
         contextArgs: object[],
         _depArgs?: object[],
         expressionContext?: ExpressionContext,
      ) {
         // Merge incoming context
         this.context = Object.assign({}, ...contextArgs)
         this._context = {}
         this._methods = {}

         // Evaluate expressions if we have an expression context
         if (expressionContext != null) {
            for (const [propertyKey, expression] of Array.from(
               (this.constructor as typeof RetVal)._expressions,
            )) {
               const value = this.evaluateExpression(expression, expressionContext)
               this.context[propertyKey] = value
            }
         }
      }

      private evaluateExpression(
         expression: ContextExpression<unknown>,
         exprCtx: ExpressionContext,
      ): unknown {
         if (typeof expression === "function") {
            return expression(exprCtx)
         }
         // String expressions would need a parser - for now just return the string
         // In production, this would delegate to an expression evaluator
         return expression
      }
   }

   // Add property getters that delegate to context
   for (const propName of propertyNames) {
      Object.defineProperty(RetVal.prototype, propName, {
         get(this: { context: Record<string, unknown> }) {
            return this.context[propName]
         },
         set(this: { context: Record<string, unknown> }, value: unknown) {
            this.context[propName] = value
         },
         configurable: false,
         enumerable: true,
      })
   }

   // Store extended metadata with expression functions
   Object.defineProperty(RetVal, EXTENDED_EXPR_META, {
      value: extendedMeta,
      writable: false,
      enumerable: false,
      configurable: false,
   })

   // Apply metadata
   applyContextPartMetadata(RetVal as unknown as ContextPartConstructor, {
      ...options,
      visibility: options.visibility ?? "public",
      provides: options.provides ?? [abstractContract],
   })

   return RetVal as unknown as MiddlewareContextConstructor<K, object>
}

// ============================================================================
// Expression Part Builder (Fluent API)
// ============================================================================

/**
 * Builder for creating expression-backed context parts with a fluent API.
 *
 * @example
 * ```typescript
 * const ExpressionPathNamePart = ExpressionPartBuilder
 *    .provides(HasPathName)
 *    .named("ExpressionPathNamePart")
 *    .compute("pathName", ctx => `${ctx.context.projectId}/${ctx.context.taskId}.png`)
 *    .build<{ pathName: string }>()
 * ```
 */
export class ExpressionPartBuilder<K extends object = object> {
   private _name?: string
   private _provides: ContextPartConstructor[] = []
   private _dependsOn: ContextPartConstructor[] = []
   private _expressions: Map<string, ContextExpression<unknown>> = new Map()
   private _priority?: number

   private constructor() {}

   /**
    * Start building a new expression part that provides the given contract
    */
   static provides(
      abstractContract: ContextPartConstructor,
   ): ExpressionPartBuilder {
      const builder = new ExpressionPartBuilder()
      builder._provides.push(abstractContract)
      return builder
   }

   /**
    * Set the name for this part
    */
   named(name: string): this {
      this._name = name
      return this
   }

   /**
    * Add additional contracts this part provides
    */
   alsoProvides(abstractContract: ContextPartConstructor): this {
      this._provides.push(abstractContract)
      return this
   }

   /**
    * Declare a dependency on another context part
    */
   dependsOn(part: ContextPartConstructor): this {
      this._dependsOn.push(part)
      return this
   }

   /**
    * Add a computed property expression (function form)
    */
   compute<T>(
      propertyKey: string,
      expression: (ctx: ExpressionContext) => T,
   ): this {
      this._expressions.set(propertyKey, expression)
      return this
   }

   /**
    * Add a computed property expression (string form for parsing)
    */
   expr(propertyKey: string, expressionString: string): this {
      this._expressions.set(propertyKey, expressionString)
      return this
   }

   /**
    * Set the assembly priority
    */
   priority(level: number): this {
      this._priority = level
      return this
   }

   /**
    * Build the expression context part
    */
   build<T extends K>(): MiddlewareContextConstructor<T, object> {
      if (this._provides.length === 0) {
         throw new Error(
            "ExpressionPartBuilder requires at least one provided contract",
         )
      }

      const expressions: Record<string, ContextExpression<unknown>> = {}
      for (const [key, expr] of Array.from(this._expressions)) {
         expressions[key] = expr
      }

      return createExpressionPart<T>(this._provides[0], {
         name: this._name ?? `Expression${this._provides[0].name}`,
         provides: this._provides,
         dependsOn: this._dependsOn,
         priority: this._priority,
         expressions: expressions as { [P in keyof T]?: ContextExpression<T[P]> },
      })
   }
}

// ============================================================================
// Expression Resolver
// ============================================================================

/**
 * Resolver that extracts expression metadata from a part and provides
 * the evaluated values at runtime.
 */
export class ExpressionResolver {
   /**
    * Get all expression definitions from a context part (basic metadata)
    */
   static getExpressionDefinitions(
      part: ContextPartConstructor,
   ): ExpressionMethodMetadata[] {
      return (part as any)[EXPRESSION_METHOD] ?? []
   }

   /**
    * Get extended expression metadata (with compiled functions)
    */
   static getExtendedExpressionDefinitions(
      part: ContextPartConstructor,
   ): ExtendedExpressionMetadata[] {
      // Prefer extended metadata if available
      const extended = (part as any)[EXTENDED_EXPR_META]
      if (extended != null) {
         return extended
      }
      // Fall back to basic metadata (no expressionFn)
      return this.getExpressionDefinitions(part).map((m) => ({
         methodName: m.methodName,
         expression: m.expression,
         contextFields: m.contextFields,
         expressionFn: undefined,
      }))
   }

   /**
    * Check if a part has any expression definitions
    */
   static hasExpressions(part: ContextPartConstructor): boolean {
      const meta = (part as any)[EXPRESSION_METHOD]
      const extended = (part as any)[EXTENDED_EXPR_META]
      return (meta != null && meta.length > 0) || (extended != null && extended.length > 0)
   }

   /**
    * Evaluate all expressions for a part against the given context.
    *
    * @param part - The context part to evaluate for
    * @param expressionContext - The context and methods available for evaluation
    * @returns Object with evaluated values keyed by method/property name
    */
   static evaluateExpressions<K extends object>(
      part: ContextPartConstructor,
      expressionContext: ExpressionContext,
   ): K {
      const definitions = this.getExtendedExpressionDefinitions(part)
      const evaluated: Record<string, unknown> = {}

      for (const def of definitions) {
         if (def.expressionFn != null) {
            evaluated[def.methodName] = def.expressionFn(expressionContext)
         } else {
            // String expression - try to parse it
            const parser = SimpleExpressionParser.parse(def.expression)
            if (parser != null) {
               evaluated[def.methodName] = parser(expressionContext)
            } else {
               // Return the string as-is if we can't parse it
               evaluated[def.methodName] = def.expression
            }
         }
      }

      return evaluated as K
   }
}

// ============================================================================
// Utilities for String Expression Parsing
// ============================================================================

/**
 * Simple expression parser for common patterns.
 * In production, this would be more sophisticated.
 *
 * Supports:
 * - Property access: `context.taskId`
 * - Method calls: `_methods.computeHash(context.seed)`
 * - String templates: `${context.projectId}/${context.taskId}.png`
 */
export class SimpleExpressionParser {
   /**
    * Parse a simple property access expression
    */
   static parsePropertyAccess(
      expression: string,
   ): ((ctx: ExpressionContext) => unknown) | undefined {
      // Match: context.propertyName or _methods.methodName
      const match = expression.match(
         /^(context|_methods)\.([a-zA-Z_][a-zA-Z0-9_]*)$/,
      )
      if (match == null) return undefined

      const [, root, prop] = match
      return (ctx: ExpressionContext) =>
         (ctx as unknown as Record<string, Record<string, unknown>>)[root][prop]
   }

   /**
    * Parse a simple string template expression
    */
   static parseStringTemplate(
      template: string,
   ): ((ctx: ExpressionContext) => string) | undefined {
      // Match: ${context.prop} or ${_methods.method()}
      const interpolationPattern = /\$\{(context|_methods)\.([^}]+)\}/g

      // Check if this looks like a template
      if (!template.includes("${")) return undefined

      return (ctx: ExpressionContext): string => {
         return template.replace(interpolationPattern, (_match, root, expr) => {
            const source = (ctx as unknown as Record<string, Record<string, unknown>>)[root]

            // Simple property access
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expr)) {
               return String(source[expr] ?? "")
            }

            // Method call - very basic
            const methodMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\(\)$/)
            if (methodMatch != null) {
               const method = source[methodMatch[1]]
               if (typeof method === "function") {
                  return String(method())
               }
            }

            return ""
         })
      }
   }

   /**
    * Try to parse an expression string into a function
    */
   static parse(
      expression: string,
   ): ((ctx: ExpressionContext) => unknown) | undefined {
      return (
         this.parsePropertyAccess(expression) ??
         this.parseStringTemplate(expression)
      )
   }
}
