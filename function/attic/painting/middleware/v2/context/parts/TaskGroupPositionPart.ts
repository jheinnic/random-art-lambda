/**
 * Task Group Position Context Part (Tier 1)
 *
 * Addresses a task within a grouped project hierarchy. Used when tasks
 * are organized into typed groups (Forms 1 and 2).
 *
 * - taskGroupIndex: which group (e.g., which TermPairSource)
 * - taskGroupType: type of this group (e.g., "prefixSuffix", "allPairs")
 * - groupedTaskIndex: index of this task within its group
 */

import {
   ContextPart,
   publicContextualize,
   type ContextPartConstructor,
   type MiddlewareContextConstructor,
} from "../index.js"

// ============================================================================
// Task Group Position Properties
// ============================================================================

/**
 * Task group position properties available in the context.
 */
export interface TaskGroupPositionProperties {
   /** Which group this task belongs to */
   readonly taskGroupIndex: number
   /** Type identifier for the group */
   readonly taskGroupType: string
   /** Index of this task within its group */
   readonly groupedTaskIndex: number
}

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that provide task group position.
 */
@ContextPart({
   name: "HasTaskGroupPosition",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasTaskGroupPosition {
   /** Which group this task belongs to */
   abstract readonly taskGroupIndex: number
   /** Type identifier for the group */
   abstract readonly taskGroupType: string
   /** Index of this task within its group */
   abstract readonly groupedTaskIndex: number
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Holder class for task group position properties.
 */
class TaskGroupPositionHolder {
   taskGroupIndex!: number
   taskGroupType!: string
   groupedTaskIndex!: number
}

/**
 * Contextualized TaskGroupPosition part.
 *
 * Provides task group addressing to the context:
 * - taskGroupIndex: which group
 * - taskGroupType: what kind of group
 * - groupedTaskIndex: which task within the group
 */
export const TaskGroupPositionPart: MiddlewareContextConstructor<
   TaskGroupPositionProperties,
   object
> = publicContextualize(TaskGroupPositionHolder, {
   name: "TaskGroupPositionPart",
   provides: [HasTaskGroupPosition as unknown as ContextPartConstructor],
   visibility: "public",
}) as MiddlewareContextConstructor<TaskGroupPositionProperties, object>
