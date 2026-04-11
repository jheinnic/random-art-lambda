/**
 * Permutation Context Module Factory (L3 Convenience)
 *
 * Composes BOTH term awareness AND expression-resolved path naming
 * into a single context module. This is an L3-style convenience
 * facade -- consumers can also compose the L2 parts independently:
 *
 * - For term awareness without path naming:
 *   Compose DeclareEncodingPart + TermFunctionsPart directly.
 *
 * - For expression paths without terms:
 *   Use createResolvedPathPart() directly with any expression context.
 *
 * - For both together:
 *   Use this factory.
 */

import {
   BaseTaskPart,
   BuiltInFunctionsPart,
   ProjectIdentityPart,
   InjectedFileStorePart,
   ProjectPositionPart,
   TaskGroupPositionPart,
   TermGroupPositionPart,
   TermPositionPart,
   createResolvedPathPart,
} from "../../middleware/context/parts/index.js"
import {
   MiddlewareContextModuleBuilder,
   type ContextPartConstructor,
} from "../../middleware/context/index.js"
import type { ExpressionVisibility } from "../../middleware/expression/ExpressionVisibility.js"
import type { FileNameExpressionConfig } from "../../middleware/expression/FileNameExpressionConfig.js"
import { DeclareEncodingPart } from "../context/parts/DeclareEncodingPart.js"
import { TermFunctionsPart } from "../context/parts/TermFunctionsPart.js"

/**
 * Options for creating a permutation context module.
 */
export interface PermutationContextModuleOptions {
   /** Level 1: Module-configured expression (optional) */
   moduleExpression?: string

   /** Level 2: Project-level expression (optional) */
   projectExpression?: string

   /** Level 3: Permutation-level expression (optional) */
   permutationExpression?: string

   /** Include ProjectIdentityPart in the assembly */
   includeProjectIdentity?: boolean

   /** Include InjectedFileStorePart in the assembly */
   includeFileStore?: boolean

   /** Include ProjectPositionPart in the assembly */
   includeProjectPosition?: boolean

   /** Include TaskGroupPositionPart in the assembly */
   includeTaskGroupPosition?: boolean

   /** Include TermGroupPositionPart in the assembly */
   includeTermGroupPosition?: boolean

   /** Include TermPositionPart in the assembly */
   includeTermPosition?: boolean
}

/**
 * Create a context module with BOTH term awareness AND expression-resolved paths.
 *
 * Assembles Tier 1 (core) + Tier 2 (terms + path) parts into a single module:
 * - BaseTaskPart: binary seeds (Tier 1)
 * - DeclareEncodingPart: input encoding declaration (L2)
 * - BuiltInFunctionsPart: hash functions on binary seeds (Tier 1)
 * - TermFunctionsPart: term reconstruction functions (L2)
 * - ResolvedPathPart: expression → pathName (Middleware - L2)
 *
 * Optionally includes ProjectIdentityPart, InjectedFileStorePart,
 * and position parts (ProjectPosition, TaskGroupPosition,
 * TermGroupPosition, TermPosition).
 *
 * @param config - Expression configuration with default and visibility settings
 * @param options - Optional overrides and feature flags
 * @returns A module builder result with `forRoot()` method
 *
 * @example
 * ```typescript
 * const config: FileNameExpressionConfig = {
 *   defaultExpression: '${_methods.prefixAndSuffixHash()}.png',
 *   moduleLevel: 'optional',
 *   projectLevel: 'optional',
 *   permutationLevel: 'optional',
 * }
 *
 * const ContextModule = createPermutationContextModule(config, {
 *   projectExpression: '${_methods.prefixTerm()}_${_methods.suffixTerm()}.png',
 *   includeProjectIdentity: true,
 *   includeProjectPosition: true,
 *   includeTaskGroupPosition: true,
 *   includeTermPosition: true,
 * })
 *
 * @Module({ imports: [ContextModule.forRoot()] })
 * export class WorkerModule {}
 * ```
 */
export function createPermutationContextModule(
   config: FileNameExpressionConfig<
      ExpressionVisibility,
      ExpressionVisibility,
      ExpressionVisibility
   >,
   options?: PermutationContextModuleOptions,
): { forRoot: () => import("@nestjs/common").DynamicModule } {
   const pathPart = createResolvedPathPart(
      "PermutationResolvedPathPart",
      config,
      options?.moduleExpression,
      options?.projectExpression,
      options?.permutationExpression,
   )

   const parts: ContextPartConstructor[] = [
      BaseTaskPart as unknown as ContextPartConstructor,
      DeclareEncodingPart as unknown as ContextPartConstructor,
      BuiltInFunctionsPart as unknown as ContextPartConstructor,
      TermFunctionsPart as unknown as ContextPartConstructor,
      pathPart as unknown as ContextPartConstructor,
   ]

   if (options?.includeProjectIdentity === true) {
      // Insert after BaseTaskPart
      parts.splice(
         1,
         0,
         ProjectIdentityPart as unknown as ContextPartConstructor,
      )
   }
   if (options?.includeProjectPosition === true) {
      parts.push(ProjectPositionPart as unknown as ContextPartConstructor)
   }
   if (options?.includeTaskGroupPosition === true) {
      parts.push(TaskGroupPositionPart as unknown as ContextPartConstructor)
   }
   if (options?.includeTermGroupPosition === true) {
      parts.push(TermGroupPositionPart as unknown as ContextPartConstructor)
   }
   if (options?.includeTermPosition === true) {
      parts.push(TermPositionPart as unknown as ContextPartConstructor)
   }
   if (options?.includeFileStore === true) {
      parts.push(InjectedFileStorePart as unknown as ContextPartConstructor)
   }

   return MiddlewareContextModuleBuilder.create("PermutationContextModule")
      .addParts(parts)
      .build()
}
