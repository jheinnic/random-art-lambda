/**
 * Term Group Position Context Part (Tier 1)
 *
 * Addresses the term groups when they are independently addressable
 * from task groups (Forms 2 and 3). Each of prefix and suffix may
 * come from a different group with its own type.
 *
 * - prefixGroupIndex/prefixGroupType: identifies the prefix source group
 * - suffixGroupIndex/suffixGroupType: identifies the suffix source group
 */

import {
   ContextPart,
   publicContextualize,
   type ContextPartConstructor,
   type MiddlewareContextConstructor,
} from "../index.js"

// ============================================================================
// Term Group Position Properties
// ============================================================================

/**
 * Term group position properties available in the context.
 */
export interface TermGroupPositionProperties {
   /** Index of the prefix source group */
   readonly prefixGroupIndex: number
   /** Type identifier for the prefix source group */
   readonly prefixGroupType: string
   /** Index of the suffix source group */
   readonly suffixGroupIndex: number
   /** Type identifier for the suffix source group */
   readonly suffixGroupType: string
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that provide term group position.
 */
@ContextPart({
   name: "HasTermGroupPosition",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasTermGroupPosition {
   /** Index of the prefix source group */
   abstract readonly prefixGroupIndex: number
   /** Type identifier for the prefix source group */
   abstract readonly prefixGroupType: string
   /** Index of the suffix source group */
   abstract readonly suffixGroupIndex: number
   /** Type identifier for the suffix source group */
   abstract readonly suffixGroupType: string
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Holder class for term group position properties.
 */
class TermGroupPositionHolder {
   prefixGroupIndex!: number
   prefixGroupType!: string
   suffixGroupIndex!: number
   suffixGroupType!: string
}

/**
 * Contextualized TermGroupPosition part.
 *
 * Provides term group addressing to the context:
 * - prefixGroupIndex/prefixGroupType: prefix source group
 * - suffixGroupIndex/suffixGroupType: suffix source group
 */
export const TermGroupPositionPart: MiddlewareContextConstructor<
   TermGroupPositionProperties,
   object
> = publicContextualize(TermGroupPositionHolder, {
   name: "TermGroupPositionPart",
   provides: [HasTermGroupPosition as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<TermGroupPositionProperties, object>
