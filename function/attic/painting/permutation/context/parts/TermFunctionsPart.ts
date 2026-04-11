/**
 * Term Expression Functions Context Part
 *
 * Provides expression-accessible functions for working with original
 * input terms. These functions become available in the `_methods`
 * namespace of the context, enabling expression-based filename
 * generation using original terms instead of binary seed hashes.
 *
 * This part depends on HasBaseTask (for binary seeds) and
 * HasDeclaredEncoding (for the encoding name) to reconstruct
 * original term strings on demand from binary data.
 */

import {
   METHODS,
   type ContextPartConstructor,
   applyContextPartMetadata,
   type MiddlewareContextConstructor,
   ContextPart,
} from "../../../middleware/context/index.js"

// ============================================================================
// Expression Context for Term Functions
// ============================================================================

/**
 * Context interface for term expression functions.
 *
 * These properties are expected to be present when term functions
 * are called. They come from BaseTaskPart and DeclareEncodingPart.
 */
export interface TermExpressionContext {
   /** Binary seed prefix (from BaseTaskPart) */
   readonly seedPrefix: string
   /** Binary seed suffix (from BaseTaskPart) */
   readonly seedSuffix: string
   /** Input encoding (from DeclareEncodingPart) */
   readonly inputEncoding: BufferEncoding
}

// ============================================================================
// Term Functions Implementation
// ============================================================================

/**
 * Expression functions for accessing original input terms.
 *
 * These are permutation-framework-specific functions that complement
 * the core engine's BuiltInFunctions (which operate on binary seeds).
 * They reconstruct original term strings by decoding binary seeds
 * using the declared input encoding.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TermFunctions {
   /**
    * Reconstruct the original prefix term from its binary seed.
    *
    * Decodes the base64url-encoded binary seed using the declared
    * input encoding to recover the original term string.
    *
    * @example prefixTerm()
    */
   static prefixTerm(this: TermExpressionContext): string {
      return Buffer.from(this.seedPrefix, "base64url").toString(
         this.inputEncoding ?? "utf-8",
      )
   }

   /**
    * Reconstruct the original suffix term from its binary seed.
    *
    * @example suffixTerm()
    */
   static suffixTerm(this: TermExpressionContext): string {
      return Buffer.from(this.seedSuffix, "base64url").toString(
         this.inputEncoding ?? "utf-8",
      )
   }
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that provide term expression functions.
 */
@ContextPart({
   name: "HasTermFunctions",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasTermFunctions {
   /** Reconstruct original prefix term from binary seed */
   abstract prefixTerm(): string
   /** Reconstruct original suffix term from binary seed */
   abstract suffixTerm(): string
}

// ============================================================================
// Term Methods Type
// ============================================================================

/**
 * Type for the methods provided by TermFunctionsPart
 */
export interface TermMethods {
   prefixTerm: () => string
   suffixTerm: () => string
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Get the method names from TermFunctions class.
 */
function getTermMethodNames(): string[] {
   return Object.getOwnPropertyNames(TermFunctions).filter(
      (name) =>
         name !== "constructor" &&
         name !== "prototype" &&
         name !== "length" &&
         name !== "name" &&
         typeof (TermFunctions as unknown as Record<string, unknown>)[name] ===
            "function",
   )
}

const termMethodNames = getTermMethodNames()

/**
 * Wrapper class that delegates to TermFunctions static methods.
 */
class TermFunctionsWrapper {
   readonly context: TermExpressionContext = {} as TermExpressionContext
   readonly _context: object = {}
   readonly _methods: TermMethods = {} as TermMethods

   static readonly [METHODS]: string[] = termMethodNames
}

// Add method implementations that delegate to TermFunctions
for (const methodName of termMethodNames) {
   const fn = (TermFunctions as unknown as Record<string, Function>)[methodName]
   Object.defineProperty(TermFunctionsWrapper.prototype, methodName, {
      value: function (this: { context: TermExpressionContext }) {
         return fn.call(this.context)
      },
      writable: false,
      enumerable: true,
      configurable: false,
   })
}

/**
 * TermFunctionsPart - Provides term expression functions to the context.
 *
 * Depends on HasBaseTask (for seedPrefix, seedSuffix) and
 * HasDeclaredEncoding (for inputEncoding) to reconstruct original
 * term strings from binary seeds on demand.
 */
export const TermFunctionsPart: MiddlewareContextConstructor<
   TermMethods,
   object
> = TermFunctionsWrapper as unknown as MiddlewareContextConstructor<
   TermMethods,
   object
>

// Apply metadata
applyContextPartMetadata(
   TermFunctionsPart as unknown as ContextPartConstructor,
   {
      name: "TermFunctionsPart",
      provides: [HasTermFunctions as unknown as ContextPartConstructor],
      visibility: "public",
   },
)
