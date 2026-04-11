/**
 * Permutation Input Spec Base Interfaces
 *
 * Base interfaces for domain-specific permutation specs, project specs,
 * and paint task extensions. Domain applications (e.g., Trigrams) extend
 * these interfaces to inherit encoding and expression fields.
 *
 * Generic type parameters control field visibility using the
 * ExpressionVisibility system, enabling compile-time enforcement
 * of which expression levels are required, optional, or hidden.
 *
 * Uses VisibleProps intersection to correctly handle the `?` modifier:
 * - 'hidden': no `fileNameExpression` property at all
 * - 'optional': `fileNameExpression?: string` (truly optional)
 * - 'mandatory': `fileNameExpression: string` (required)
 */

import type {
   ExpressionVisibility,
   VisibleProps,
} from "../../../../painting/messages/expression/ExpressionVisibility.js"

/**
 * Base type for permutation-level specs.
 *
 * Owns `inputEncoding` and `fileNameExpression` -- domain specs extend this
 * to inherit these fields alongside their domain-specific properties.
 *
 * @typeParam PermVis - Visibility of the fileNameExpression field
 *
 * @example
 * ```typescript
 * // Domain spec extending with optional expression (default)
 * interface PrefixSuffixSpec extends PermutationInputSpec {
 *   expandType: 'permutePrefixSuffix'
 *   prefixTrigrams: string[]
 *   suffixTrigrams: string[]
 * }
 * ```
 */
export type PermutationInputSpec<
   PermVis extends ExpressionVisibility = "optional",
> = {
   /**
    * Source encoding of the input terms.
    * Defaults to 'utf-8' when not specified.
    */
   inputEncoding?: BufferEncoding
} & VisibleProps<PermVis, "fileNameExpression", string>

/**
 * Base type for project-level specs.
 *
 * Owns the project-level `fileNameExpression`. Domain project specs
 * extend this to inherit alongside domain-specific properties like
 * region map catalogs or domain-specific configuration.
 *
 * @typeParam ProjVis - Visibility of the fileNameExpression field
 *
 * @example
 * ```typescript
 * interface TrigramProjectSpec extends PermutationProjectSpec {
 *   regionMapCatalog: RegionMapCatalog
 *   permutationSpecs: PermutationSpec[]
 * }
 * ```
 */
export type PermutationProjectSpec<
   ProjVis extends ExpressionVisibility = "optional",
> = {
   /** Unique project identifier */
   projectId: string
} & VisibleProps<ProjVis, "fileNameExpression", string>

/**
 * Base interface for paint task domain extensions.
 *
 * Carries the resolved expression and input encoding through the
 * pipeline from expansion to the worker context. Domain paint tasks
 * extend this to add their domain-specific tracking fields.
 *
 * @example
 * ```typescript
 * interface TrigramPaintTask extends PermutationPaintTask {
 *   prefixTrigram: string
 *   suffixTrigram: string
 *   prefixIndex: number
 *   suffixIndex: number
 * }
 * ```
 */
export interface PermutationPaintTask {
   /** Resolved filename expression from the precedence chain */
   resolvedFileNameExpression?: string

   /** Input encoding used for the terms in this task */
   inputEncoding?: BufferEncoding
}
