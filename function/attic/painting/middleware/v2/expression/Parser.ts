/**
 * Parser interface with accumulated extensions.
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
   evaluate: <T>(expression: string, context: any) => Promise<T>
}
