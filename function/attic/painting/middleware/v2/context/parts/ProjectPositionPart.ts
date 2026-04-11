/**
 * Project Position Context Part (Tier 1)
 *
 * Provides the flat ordinal position of a task within a multi-task project
 * and the index of the region map used. Only attached when a task belongs
 * to a project.
 *
 * The regionMapIndex is agnostic about whether it indexes a project-level
 * or group-level collection -- the abstraction doesn't care which
 * collection the index applies to.
 */

import {
   ContextPart,
   type ContextPartConstructor,
   publicContextualize,
   type MiddlewareContextConstructor,
} from "../index.js"

// ============================================================================
// Project Position Properties
// ============================================================================

/**
 * Project position properties available in the context.
 */
export interface ProjectPositionProperties {
   /** Flat ordinal of this task within the project */
   readonly paintProjectTaskIndex: number
   /** Index of the region map used for this task */
   readonly regionMapIndex: number
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that provide project position.
 */
@ContextPart({
   name: "HasProjectPosition",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasProjectPosition {
   /** Flat ordinal of this task within the project */
   abstract readonly paintProjectTaskIndex: number
   /** Index of the region map used for this task */
   abstract readonly regionMapIndex: number
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Holder class for project position properties.
 */
class ProjectPositionHolder {
   paintProjectTaskIndex!: number
   regionMapIndex!: number
}

/**
 * Contextualized ProjectPosition part.
 *
 * Provides project-level position to the context:
 * - paintProjectTaskIndex: flat ordinal within the project
 * - regionMapIndex: which region map is used
 */
export const ProjectPositionPart: MiddlewareContextConstructor<
   ProjectPositionProperties,
   object
> = publicContextualize(ProjectPositionHolder, {
   name: "ProjectPositionPart",
   provides: [HasProjectPosition as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<ProjectPositionProperties, object>
