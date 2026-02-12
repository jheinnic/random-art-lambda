/**
 * Built-In Functions Context Part
 *
 * Provides expression-accessible functions for seed encoding/hashing.
 * These functions become available in the `_methods` namespace of the context.
 */

import {
   METHODS,
   type ContextPartConstructor,
   type ContextPartOptions,
   publicContextualize,
   applyContextPartMetadata,
   type MiddlewareContextConstructor,
   ContextPart,
} from "../index.js"
import { BuiltInFunctions, type ExpressionContext as BaseExpressionContext } from "../../expression/index.js"

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that need built-in expression functions.
 *
 * @example
 * ```typescript
 * const ExpressionPathPart = createExpressionPart(HasPathName, {
 *    dependsOn: [HasBuiltInFunctions],
 *    expressions: {
 *       pathName: "`${_methods.prefixAndSuffixHash()}.png`"
 *    }
 * })
 * ```
 */
@ContextPart({
   name: "HasBuiltInFunctions",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasBuiltInFunctions {
   /** Decode seed prefix bytes to UTF-8 string */
   abstract prefixAsUtf8(): string
   /** Decode seed suffix bytes to UTF-8 string */
   abstract suffixAsUtf8(): string
   /** SHA-256 hash of seed prefix */
   abstract prefixHash(): string
   /** SHA-256 hash of seed suffix */
   abstract suffixHash(): string
   /** Combined hash of prefix + "randomArt" + suffix */
   abstract prefixAndSuffixHash(): string
   /** Get region map name or CID */
   abstract regionMapName(): string
}

// ============================================================================
// Built-In Functions Methods Type
// ============================================================================

/**
 * Type for the methods provided by BuiltInFunctionsPart
 */
export interface BuiltInMethods {
   prefixAsUtf8: () => string
   suffixAsUtf8: () => string
   prefixHash: () => string
   suffixHash: () => string
   prefixAndSuffixHash: () => string
   regionMapName: () => string
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Get the method names from BuiltInFunctions class.
 */
function getBuiltInMethodNames(): string[] {
   return Object.getOwnPropertyNames(BuiltInFunctions).filter(
      (name) =>
         name !== "constructor" &&
         name !== "prototype" &&
         name !== "length" &&
         name !== "name" &&
         typeof (BuiltInFunctions as unknown as Record<string, unknown>)[name] === "function",
   )
}

/**
 * Contextualized BuiltInFunctions part.
 *
 * This part exposes the BuiltInFunctions methods through the `_methods`
 * namespace, making them available in expressions.
 *
 * The methods are bound to the context at creation time, so they have
 * access to seedPrefix, seedSuffix, regionMapName, etc.
 *
 * @example
 * ```typescript
 * const ctx = contextFactory.create({ seedPrefix: "...", seedSuffix: "..." })
 * const hash = ctx._methods.prefixAndSuffixHash()
 * ```
 */
const methodNames = getBuiltInMethodNames()

// Create a class that wraps BuiltInFunctions methods
class BuiltInFunctionsWrapper {
   // Methods will be added dynamically
   readonly context: BaseExpressionContext = {} as BaseExpressionContext
   readonly _context: object = {}
   readonly _methods: BuiltInMethods = {} as BuiltInMethods

   static readonly [METHODS]: string[] = methodNames
}

// Add method implementations that delegate to BuiltInFunctions
for (const methodName of methodNames) {
   const fn = (BuiltInFunctions as unknown as Record<string, Function>)[methodName]
   Object.defineProperty(BuiltInFunctionsWrapper.prototype, methodName, {
      value: function (this: { context: BaseExpressionContext }) {
         // Call BuiltInFunctions method with context as `this`
         return fn.call(this.context)
      },
      writable: false,
      enumerable: true,
      configurable: false,
   })
}

/**
 * BuiltInFunctionsPart - Provides expression functions to the context.
 *
 * Depends on HasBaseTask (or any part that provides seedPrefix/seedSuffix)
 * to function correctly, as the functions read from context.
 */
export const BuiltInFunctionsPart: MiddlewareContextConstructor<BuiltInMethods, object> =
   BuiltInFunctionsWrapper as unknown as MiddlewareContextConstructor<BuiltInMethods, object>

// Apply metadata
applyContextPartMetadata(BuiltInFunctionsPart as unknown as ContextPartConstructor, {
   name: "BuiltInFunctionsPart",
   provides: [HasBuiltInFunctions as unknown as ContextPartConstructor],
   visibility: "public",
})
