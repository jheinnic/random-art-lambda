import { AsyncLocalStorage } from "async_hooks"
import type { ContextKeysAndPairs, CallableParams } from "./types.js"
import { ConfigService } from "@nestjs/config"

export const CONFIG_SERVICE_STORE: AsyncLocalStorage<ConfigService> =
   new AsyncLocalStorage<ConfigService>()

// =============================================================================
// cm() — Type-safe feature method factory
// =============================================================================

/**
 * Create a type-safe {method, selectors} pair for use in feature property definitions.
 *
 * Feature property objects assigned inline lose parameter-type inference because TypeScript
 * cannot flow the selector tuple type back to infer the method's parameter types. This
 * curried helper restores that checking by explicitly binding the merged context type.
 *
 * Pass the pipeline's `AllContext` (or a compatible alias) as the single type argument.
 * The inner call takes `selectors` and `method` with fully-inferred, selector-driven
 * parameter types.
 *
 * @example
 * ```typescript
 * // AllCtx is the full merged context at the point of use
 * type AllCtx = { prefix: Uint8ClampedArray; originalEncoding: BufferEncoding }
 *
 * const prefixDef = cm<AllCtx>()(
 *   ["prefix", "originalEncoding"] as const,
 *   (binary, encoding) => Buffer.from(binary.buffer).toString(encoding),
 *   // ^ typed (Uint8ClampedArray, BufferEncoding) => string — checked at call site
 * )
 * ```
 */
export function cm<AllContext extends object>() {
   return function <
      ReturnType,
      Selectors extends ReadonlyArray<ContextKeysAndPairs<AllContext>>,
   >(
      selectors: Selectors,
      method: (
         ...args: CallableParams<AllContext, Selectors>
      ) => ReturnType | Promise<ReturnType>,
   ): {
      method: (
         ...args: CallableParams<AllContext, Selectors>
      ) => ReturnType | Promise<ReturnType>
      selectors: Selectors
   } {
      return { method, selectors }
   }
}
