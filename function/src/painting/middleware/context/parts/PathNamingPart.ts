/**
 * Path Naming Context Part
 *
 * Provides expression-based filename/path generation.
 * Uses the expression system to compute paths from context values,
 * enabling deployment on worker nodes without application-specific code.
 */

import {
   ContextPart,
   createExpressionPart,
   ExpressionPartBuilder,
   type ContextPartConstructor,
   type ExpressionContext,
   type MiddlewareContextConstructor,
} from "../index.js"

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that need a computed path name.
 *
 * @example
 * ```typescript
 * const StagingActivity = activityContextualize(
 *    ImageStagingActivity,
 *    ["stagedPath"],
 *    ["fileStore", "pathName"],
 *    {
 *       dependsOn: [HasFileStore, HasPathName],
 *    }
 * )
 * ```
 */
@ContextPart({
   name: "HasPathName",
   isAbstract: true,
   visibility: "public",
})
export abstract class HasPathName {
   /** The computed file path/name */
   abstract readonly pathName: string
}

// ============================================================================
// Default Expression-Based Provider
// ============================================================================

/**
 * Default path naming using prefix+suffix hash.
 *
 * Generates paths like: `{prefixAndSuffixHash}.png`
 *
 * This is suitable for basic use cases where you want deterministic
 * filenames based on the seed values.
 */
export const HashBasedPathPart: MiddlewareContextConstructor<
   { pathName: string },
   object
> = createExpressionPart<{ pathName: string }>(
   HasPathName as unknown as ContextPartConstructor,
   {
      name: "HashBasedPathPart",
      provides: [HasPathName as unknown as ContextPartConstructor],
      expressions: {
         pathName: (ctx: ExpressionContext) => {
            // Access the prefixAndSuffixHash method from _methods
            const hashFn = ctx._methods["prefixAndSuffixHash"] as
               | (() => string)
               | undefined
            if (hashFn != null) {
               return `${hashFn()}.png`
            }
            // Fallback if method not available
            return `${ctx.context["taskId"] ?? "unknown"}.png`
         },
      },
   },
)

/**
 * Path naming with project directory structure.
 *
 * Generates paths like: `{projectId}/{prefixAndSuffixHash}.png`
 *
 * Useful when organizing outputs by project.
 */
export const ProjectPathPart: MiddlewareContextConstructor<
   { pathName: string },
   object
> = createExpressionPart<{ pathName: string }>(
   HasPathName as unknown as ContextPartConstructor,
   {
      name: "ProjectPathPart",
      provides: [HasPathName as unknown as ContextPartConstructor],
      expressions: {
         pathName: (ctx: ExpressionContext) => {
            const projectId = ctx.context["projectId"] as string | undefined
            const hashFn = ctx._methods["prefixAndSuffixHash"] as
               | (() => string)
               | undefined

            const hash =
               hashFn != null
                  ? hashFn()
                  : String(ctx.context["taskId"] ?? "unknown")
            const prefix =
               projectId != null && projectId.length > 0 ? `${projectId}/` : ""

            return `${prefix}${hash}.png`
         },
      },
   },
)

// ============================================================================
// Builder for Custom Path Expressions
// ============================================================================

/**
 * Create a custom path naming part with your own expression.
 *
 * @param name - Part name for registration
 * @param pathExpression - Function that computes the path from context
 * @returns A MiddlewareContextConstructor for the path part
 *
 * @example
 * ```typescript
 * // Custom path with region map in the name
 * const RegionPathPart = createPathPart(
 *    "RegionPathPart",
 *    ctx => `${ctx.context.regionMapName}/${ctx._methods.prefixAndSuffixHash()}.png`
 * )
 * ```
 */
export function createPathPart(
   name: string,
   pathExpression: (ctx: ExpressionContext) => string,
): MiddlewareContextConstructor<{ pathName: string }, object> {
   return ExpressionPartBuilder.provides(
      HasPathName as unknown as ContextPartConstructor,
   )
      .named(name)
      .compute("pathName", pathExpression)
      .build<{ pathName: string }>()
}

/**
 * Create a path naming part from a string template.
 *
 * The template can use simple interpolations like:
 * - `${context.projectId}` - access context properties
 * - `${_methods.prefixAndSuffixHash()}` - call methods
 *
 * Note: String templates are evaluated at runtime by the expression parser.
 * For complex logic, use `createPathPart()` with a function instead.
 *
 * @example
 * ```typescript
 * const MyPathPart = createPathPartFromTemplate(
 *    "MyPathPart",
 *    "${context.projectId}/${_methods.prefixAndSuffixHash()}.png"
 * )
 * ```
 */
export function createPathPartFromTemplate(
   name: string,
   template: string,
): MiddlewareContextConstructor<{ pathName: string }, object> {
   return ExpressionPartBuilder.provides(
      HasPathName as unknown as ContextPartConstructor,
   )
      .named(name)
      .expr("pathName", template)
      .build<{ pathName: string }>()
}
