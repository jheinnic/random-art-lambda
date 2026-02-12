import type { Type } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { TokensForDependencies } from "./TokensForDependencies.js"

/**
 * Legacy middleware handler interface - DEPRECATED
 * For backward compatibility during migration.
export interface LegacyMiddlewareHandler<TContext = any> {
   handle: (ctx: TContext) => Promise<TContext>
}
 */
/**
 * Configuration for a single middleware handler in the chain
 *
 * Internal tokens (for params, logger, and middleware instance) are auto-generated
 */

export interface MiddlewareProps<M extends Type<MiddlewareHandler<any, any>>> {
   /**
    * The middleware handler class to instantiate
    */
   middlewareClass: M

   /**
    * Value object containing configuration parameters
    * Passed as the first constructor argument
    * Use {} for middleware with no params
    */
   valueParams: ConstructorParameters<M>[0]

   /**
    * Optional dependency injection tokens for dependencies after logger
    * These are injected as the 3rd+ constructor arguments
    */
   inject?: TokensForDependencies<M>
}
