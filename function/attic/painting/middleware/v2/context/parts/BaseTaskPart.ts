/**
 * Base Task Context Part
 *
 * Provides the core task properties (seedPrefix, seedSuffix, resolution, etc.)
 * to the context composition system. This is typically the first part
 * in any painting middleware context assembly.
 */

import {
   ContextPart,
   type ContextPartConstructor,
   publicContextualize,
   type MiddlewareContextConstructor,
} from "../index.js"
import type {
   GenModelSeed,
   PaintResolution,
   SpatialBoundary,
} from "../../../messages/values/index.js"
import type { PaintTaskId } from "../../../messages/values/PaintTaskId.js"

// ============================================================================
// Base Task Model Interface
// ============================================================================

/**
 * Core task properties available in the context.
 * These come from the painting task/job definition.
 *
 * Note: projectId is NOT included here. If you need project identity,
 * include ProjectIdentityPart in your assembly.
 */
export interface BaseTaskProperties
   extends GenModelSeed,
      PaintResolution,
      SpatialBoundary {
   /** Unique task identifier */
   readonly taskId: PaintTaskId
   /** Region map name (human-readable) */
   readonly regionMapName?: string
   /** Region map CID (content-addressed) */
   readonly regionMapCID?: string
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that need access to base task properties.
 *
 * @example
 * ```typescript
 * // A part that depends on task properties
 * const MyPart = activityContextualize(MyActivity, [...], [...], {
 *    dependsOn: [HasBaseTask],
 * })
 * ```
 */
@ContextPart({
   name: "HasBaseTask",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasBaseTask {
   abstract readonly seedPrefix: string
   abstract readonly seedSuffix: string
   abstract readonly taskId: PaintTaskId
   abstract readonly width: number
   abstract readonly height: number
   abstract readonly size: number
   abstract readonly regionMapName?: string
   abstract readonly regionMapCID?: string
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Simple class holding base task properties.
 * Used as input to create the contextualized part.
 */
class BaseTaskHolder {
   taskId!: string
   seedPrefix!: string
   seedSuffix!: string
   width!: number
   height!: number
   size!: number
   top!: number
   bottom!: number
   left!: number
   right!: number
   regionMapName?: string
   regionMapCID?: string
}

/**
 * Contextualized BaseTask part.
 *
 * Provides core task properties to the context:
 * - seedPrefix, seedSuffix (for expression functions)
 * - taskId, projectId (for tracking)
 * - width, height, size (resolution)
 * - spatial boundaries
 * - region map identifiers
 *
 * @example
 * ```typescript
 * const PaintingContextModule = MiddlewareContextModuleBuilder
 *    .create("PaintingContext")
 *    .addParts([BaseTaskPart, ...otherParts])
 *    .build()
 * ```
 */
export const BaseTaskPart: MiddlewareContextConstructor<
   BaseTaskProperties,
   object
> = publicContextualize(BaseTaskHolder, {
   name: "BaseTaskPart",
   provides: [HasBaseTask as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<BaseTaskProperties, object>

// ============================================================================
// Helper: Create task context from input
// ============================================================================

/**
 * Helper to create initial task context from a task input object.
 *
 * @param input - Task properties from job/message
 * @returns Object suitable for context factory initialization
 */
export function createBaseTaskContext(
   input: BaseTaskProperties,
): BaseTaskProperties {
   return {
      taskId: input.taskId,
      seedPrefix: input.seedPrefix,
      seedSuffix: input.seedSuffix,
      width: input.width,
      height: input.height,
      size: input.size,
      top: input.top,
      bottom: input.bottom,
      left: input.left,
      right: input.right,
      regionMapName: input.regionMapName,
      regionMapCID: input.regionMapCID,
   }
}
