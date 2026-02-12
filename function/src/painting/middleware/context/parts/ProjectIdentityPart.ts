/**
 * Project Identity Context Part
 *
 * Provides project-level identity to the context composition system.
 * This is a separate part so that project identity can be included
 * only when appropriate (not all tasks belong to a project).
 */

import {
   ContextPart,
   type ContextPartConstructor,
   publicContextualize,
   type MiddlewareContextConstructor,
} from "../index.js"

// ============================================================================
// Project Identity Properties
// ============================================================================

/**
 * Project identity properties available in the context.
 */
export interface ProjectIdentityProperties {
   /** Unique project identifier */
   readonly projectId: string
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that need access to project identity.
 *
 * @example
 * ```typescript
 * // A part that depends on project identity
 * const ProjectPathPart = createExpressionPart(HasPathName, {
 *    dependsOn: [HasProjectIdentity],
 *    expressions: {
 *       pathName: ctx => `${ctx.context.projectId}/${ctx._methods.prefixAndSuffixHash()}.png`
 *    }
 * })
 * ```
 */
@ContextPart({
   name: "HasProjectIdentity",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasProjectIdentity {
   abstract readonly projectId: string
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Simple class holding project identity.
 * Used as input to create the contextualized part.
 */
class ProjectIdentityHolder {
   projectId!: string
}

/**
 * Contextualized ProjectIdentity part.
 *
 * Provides project identity to the context:
 * - projectId (for grouping, path naming, etc.)
 *
 * @example
 * ```typescript
 * const ProjectContextModule = MiddlewareContextModuleBuilder
 *    .create("ProjectContext")
 *    .addParts([BaseTaskPart, ProjectIdentityPart, ProjectPathPart])
 *    .build()
 * ```
 */
export const ProjectIdentityPart: MiddlewareContextConstructor<
   ProjectIdentityProperties,
   object
> = publicContextualize(ProjectIdentityHolder, {
   name: "ProjectIdentityPart",
   provides: [HasProjectIdentity as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<ProjectIdentityProperties, object>

// ============================================================================
// Helper: Create project identity context
// ============================================================================

/**
 * Helper to create project identity context from a project ID.
 *
 * @param projectId - The project identifier
 * @returns Object suitable for context factory initialization
 */
export function createProjectIdentityContext(
   projectId: string,
): ProjectIdentityProperties {
   return { projectId }
}
