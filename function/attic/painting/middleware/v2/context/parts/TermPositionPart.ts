/**
 * Term Position Context Part (Tier 1)
 *
 * Addresses the specific prefix and suffix elements within their
 * respective groups. Used in all organization forms to identify
 * which prefix and suffix were selected.
 *
 * - groupedPrefixIndex: which prefix within its group
 * - groupedSuffixIndex: which suffix within its group
 */

import {
   ContextPart,
   publicContextualize,
   type ContextPartConstructor,
   type MiddlewareContextConstructor,
} from "../index.js"

// ============================================================================
// Term Position Properties
// ============================================================================

/**
 * Term position properties available in the context.
 */
export interface TermPositionProperties {
   /** Index of the prefix element within its group */
   readonly groupedPrefixIndex: number
   /** Index of the suffix element within its group */
   readonly groupedSuffixIndex: number
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that provide term element position.
 */
@ContextPart({
   name: "HasTermPosition",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasTermPosition {
   /** Index of the prefix element within its group */
   abstract readonly groupedPrefixIndex: number
   /** Index of the suffix element within its group */
   abstract readonly groupedSuffixIndex: number
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Holder class for term position properties.
 */
class TermPositionHolder {
   groupedPrefixIndex!: number
   groupedSuffixIndex!: number
}

/**
 * Contextualized TermPosition part.
 *
 * Provides term element position to the context:
 * - groupedPrefixIndex: which prefix within its group
 * - groupedSuffixIndex: which suffix within its group
 */
export const TermPositionPart: MiddlewareContextConstructor<
   TermPositionProperties,
   object
> = publicContextualize(TermPositionHolder, {
   name: "TermPositionPart",
   provides: [HasTermPosition as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<TermPositionProperties, object>
