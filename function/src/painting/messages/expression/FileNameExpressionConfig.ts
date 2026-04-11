/**
 * Filename Expression Configuration & Resolution
 *
 * Defines a four-level precedence hierarchy for filename expressions:
 *
 * | Level | Source              | When Available                    |
 * |-------|---------------------|-----------------------------------|
 * | 0     | Hardcoded default   | Always (fallback)                 |
 * | 1     | Module config       | At module registration time       |
 * | 2     | Project spec        | In runtime JSON payload           |
 * | 3     | Permutation spec    | In runtime JSON payload           |
 *
 * Each level's visibility is controlled by generic type parameters,
 * enabling compile-time enforcement of which levels are required,
 * optional, or hidden for a given domain configuration.
 */

import type {
   ExpressionVisibility,
   VisibleProps,
} from "./ExpressionVisibility.js"

/**
 * Configuration for layered filename expression resolution.
 *
 * Generic type parameters control the visibility of each level:
 * - If a level is 'mandatory', its expression must be provided
 * - If 'optional', it may be provided to override lower levels
 * - If 'hidden', the level is not available
 *
 * @example
 * ```typescript
 * // Module config required, project/permutation optional overrides
 * const config: FileNameExpressionConfig<'mandatory', 'optional', 'optional'> = {
 *   defaultExpression: '${_methods.prefixAndSuffixHash()}.png',
 *   moduleLevel: 'mandatory',
 *   projectLevel: 'optional',
 *   permutationLevel: 'optional',
 * }
 *
 * // Hardcoded only, no runtime overrides
 * const fixed: FileNameExpressionConfig<'hidden', 'hidden', 'hidden'> = {
 *   defaultExpression: '${_methods.prefixAndSuffixHash()}.png',
 *   moduleLevel: 'hidden',
 *   projectLevel: 'hidden',
 *   permutationLevel: 'hidden',
 * }
 * ```
 */
export interface FileNameExpressionConfig<
   ModuleVis extends ExpressionVisibility = "optional",
   ProjectVis extends ExpressionVisibility = "optional",
   PermutationVis extends ExpressionVisibility = "optional",
> {
   /** Level 0: Always-available fallback expression */
   readonly defaultExpression: string

   /** Visibility for level 1 (module configuration) */
   readonly moduleLevel: ModuleVis

   /** Visibility for level 2 (project specification) */
   readonly projectLevel: ProjectVis

   /** Visibility for level 3 (permutation specification) */
   readonly permutationLevel: PermutationVis
}

/**
 * Resolve a filename expression from the precedence chain.
 *
 * Higher-precedence expressions override lower ones:
 *   permutation > project > module > default
 *
 * @param config - The expression configuration with default
 * @param moduleExpression - Level 1: from module config
 * @param projectExpression - Level 2: from project spec
 * @param permutationExpression - Level 3: from permutation spec
 * @returns The highest-precedence expression available
 */
export function resolveFileNameExpression(
   config: FileNameExpressionConfig<
      ExpressionVisibility,
      ExpressionVisibility,
      ExpressionVisibility
   >,
   moduleExpression?: string,
   projectExpression?: string,
   permutationExpression?: string,
): string {
   return (
      permutationExpression ??
      projectExpression ??
      moduleExpression ??
      config.defaultExpression
   )
}

/**
 * Shaped type for module-level expression field.
 * Presence/optionality controlled by visibility generic.
 */
export type ModuleExpressionField<V extends ExpressionVisibility> = VisibleProps<
   V,
   "fileNameExpression",
   string
>

/**
 * Shaped type for project-level expression field.
 * Presence/optionality controlled by visibility generic.
 */
export type ProjectExpressionField<V extends ExpressionVisibility> =
   VisibleProps<V, "fileNameExpression", string>

/**
 * Shaped type for permutation-level expression field.
 * Presence/optionality controlled by visibility generic.
 */
export type PermutationExpressionField<V extends ExpressionVisibility> =
   VisibleProps<V, "fileNameExpression", string>
