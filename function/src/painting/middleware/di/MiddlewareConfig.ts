import { MiddlewareProps } from "./MiddlewareProps.js"

/**
 * Configuration for item-level and collection-level middleware chains
 */

export interface MiddlewareConfig {
   /**
    * Middleware chain for individual item processing (child jobs)
    */
   itemChain: Array<MiddlewareProps<any>>

   /**
    * Middleware chain for collection processing (parent job)
   collectionChain: Array<MiddlewareProps<any>>
    */
}
