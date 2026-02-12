/**
 * Trigram Context Module
 *
 * Demonstrates how to use the middleware context composition system
 * with expression-based filename generation. The key design goal is
 * that worker nodes only need the framework's expression system and
 * base model - they don't need Trigram-specific code installed.
 *
 * ## How It Works
 *
 * 1. **Task Mapping**: The TrigramPaintTask is mapped to BaseTaskProperties
 *    at the producer side (where Trigram code IS available).
 *
 * 2. **Context Assembly**: On the worker node, the context is assembled
 *    using only framework-provided parts:
 *    - BaseTaskPart: Provides seedPrefix, seedSuffix, taskId, etc.
 *    - BuiltInFunctionsPart: Provides prefixAndSuffixHash() method
 *    - HashBasedPathPart: Computes pathName using expressions
 *
 * 3. **Expression Evaluation**: The pathName is computed using an
 *    expression that calls `_methods.prefixAndSuffixHash()`, which
 *    evaluates entirely within the framework without needing any
 *    Trigram-specific code.
 *
 * ## Usage Example
 *
 * ```typescript
 * // On the producer side (Trigram code available):
 * const baseProps = mapTrigramTaskToBaseProperties(trigramTask)
 *
 * // On the worker side (framework only):
 * const context = contextFactory.create(baseProps)
 * console.log(context.context.pathName)  // e.g., "abc123XYZ.png"
 * ```
 */

import type { TrigramPaintTask } from "../models/paint/TrigramPaintTask.js"
import type { TrigramProjectSpec } from "../models/spec/TrigramProjectSpec.js"

import {
   // Context Module Builder
   MiddlewareContextModuleBuilder,
   CONTEXT_FACTORY_TOKEN,
   type IContextFactory,
   // RA-Provided Parts
   BaseTaskPart,
   BuiltInFunctionsPart,
   HashBasedPathPart,
   ProjectPathPart,
   ProjectIdentityPart,
   InjectedFileStorePart,
   FILE_STORE_TOKEN,
   type BaseTaskProperties,
   type ProjectIdentityProperties,
   type IFileStore,
   // Registry for custom parts
   type ContextPartConstructor,
} from "../../../painting/middleware/context/index.js"

import type { PaintTaskId } from "../../../painting/messages/values/PaintTaskId.js"
import type { PaintResolution } from "../../../painting/messages/values/PaintResolution.js"
import type { SpatialBoundary } from "../../../painting/messages/values/SpatialBoundary.js"
import { SeedEncodingUtil } from "../../../messages/components/SeedEncodingUtil.js"

// ============================================================================
// Task Mapping (Producer Side - Trigram code available)
// ============================================================================

/**
 * Result of mapping a TrigramPaintTask to context properties.
 * Separates base task properties from project identity.
 */
export interface TrigramContextMapping {
   /** Core task properties (seeds, resolution, region map) */
   readonly baseTask: BaseTaskProperties
   /** Project identity (optional, only if task belongs to a project) */
   readonly projectIdentity?: ProjectIdentityProperties
}

/**
 * Maps a TrigramPaintTask to context properties.
 *
 * This function runs on the producer side where Trigram code is available.
 * The result can be serialized and sent to workers that only have the
 * framework installed.
 *
 * @param task - The Trigram-specific paint task
 * @param resolution - The paint resolution (width, height, size)
 * @param boundary - The spatial boundary (left, right, top, bottom)
 * @param regionMapName - The name of the region map being used
 * @param regionMapCID - The CID of the region map
 * @param taskId - The unique task identifier
 * @param projectSpec - Optional project specification (if task belongs to a project)
 * @returns TrigramContextMapping with base properties and optional project identity
 */
export function mapTrigramTaskToContextProperties(
   task: TrigramPaintTask,
   resolution: PaintResolution,
   boundary: SpatialBoundary,
   regionMapName: string,
   regionMapCID: string,
   taskId: PaintTaskId,
   projectSpec?: TrigramProjectSpec,
): TrigramContextMapping {
   const baseTask: BaseTaskProperties = {
      taskId,
      seedPrefix: SeedEncodingUtil.fromEncodedPrefix(task.prefixTrigram),
      seedSuffix: SeedEncodingUtil.fromEncodedSuffix(task.suffixTrigram),
      width: resolution.width,
      height: resolution.height,
      size: resolution.size,
      left: boundary.left,
      right: boundary.right,
      top: boundary.top,
      bottom: boundary.bottom,
      regionMapName,
      regionMapCID,
   }

   const projectIdentity: ProjectIdentityProperties | undefined =
      projectSpec != null ? { projectId: projectSpec.projectId } : undefined

   return { baseTask, projectIdentity }
}

// ============================================================================
// Context Module (Worker Side - Framework only)
// ============================================================================

/**
 * Context module for basic Trigram painting with hash-based filenames.
 *
 * This module assembles:
 * - BaseTaskPart: Core task properties (seedPrefix, seedSuffix, taskId, etc.)
 * - BuiltInFunctionsPart: Hash computation methods
 * - HashBasedPathPart: Expression-based path naming using prefixAndSuffixHash()
 *
 * The result is a context where `pathName` is automatically computed as
 * `${prefixAndSuffixHash()}.png` without any Trigram-specific code.
 */
export const TrigramBasicContextModule = MiddlewareContextModuleBuilder.create(
   "TrigramBasicContextModule",
)
   .addParts([
      BaseTaskPart as unknown as ContextPartConstructor,
      BuiltInFunctionsPart as unknown as ContextPartConstructor,
      HashBasedPathPart as unknown as ContextPartConstructor,
   ])
   .build()

/**
 * Context module with project-organized filenames.
 *
 * Like TrigramBasicContextModule but includes ProjectIdentityPart and uses
 * ProjectPathPart which generates paths like `${projectId}/${prefixAndSuffixHash()}.png`
 *
 * Requires projectIdentity to be included in the initial context.
 */
export const TrigramProjectContextModule =
   MiddlewareContextModuleBuilder.create("TrigramProjectContextModule")
      .addParts([
         BaseTaskPart as unknown as ContextPartConstructor,
         ProjectIdentityPart as unknown as ContextPartConstructor,
         BuiltInFunctionsPart as unknown as ContextPartConstructor,
         ProjectPathPart as unknown as ContextPartConstructor,
      ])
      .build()

/**
 * Full context module with file storage support.
 *
 * Includes all parts plus injection-backed file storage.
 * Requires:
 * - projectIdentity in the initial context
 * - FILE_STORE_TOKEN to be bound to an IFileStore implementation
 */
export const TrigramFullContextModule = MiddlewareContextModuleBuilder.create(
   "TrigramFullContextModule",
)
   .addParts([
      BaseTaskPart as unknown as ContextPartConstructor,
      ProjectIdentityPart as unknown as ContextPartConstructor,
      BuiltInFunctionsPart as unknown as ContextPartConstructor,
      ProjectPathPart as unknown as ContextPartConstructor,
      InjectedFileStorePart as unknown as ContextPartConstructor,
   ])
   // NOTE: Actual binding should be done at application level, e.g.:
   // .withDependency(FILE_STORE_TOKEN, { provide: FILE_STORE_TOKEN, useClass: S3FileStore })
   .build()

// ============================================================================
// Re-exports for convenience
// ============================================================================

export {
   CONTEXT_FACTORY_TOKEN,
   FILE_STORE_TOKEN,
   type IContextFactory,
   type BaseTaskProperties,
   type ProjectIdentityProperties,
   type IFileStore,
}

// ============================================================================
// Example Usage (for documentation)
// ============================================================================

/**
 * Example showing how a worker would use the context.
 *
 * ```typescript
 * // In your NestJS module:
 * @Module({
 *    imports: [TrigramBasicContextModule.forRoot()],
 * })
 * export class WorkerModule {}
 *
 * // In your worker service:
 * @Injectable()
 * export class PaintingWorker {
 *    constructor(
 *       @Inject(CONTEXT_FACTORY_TOKEN)
 *       private readonly contextFactory: IContextFactory,
 *    ) {}
 *
 *    async processTask(baseProps: BaseTaskProperties) {
 *       // Create the context - pathName is automatically computed!
 *       const context = this.contextFactory.create(baseProps)
 *
 *       // Access the computed path
 *       const outputPath = context.context.pathName as string
 *       // e.g., "qJ7x2P8kLmN.png" (hash of prefix + suffix)
 *
 *       // The worker doesn't need to know anything about Trigrams
 *       // to generate deterministic, content-based filenames
 *    }
 * }
 * ```
 */
