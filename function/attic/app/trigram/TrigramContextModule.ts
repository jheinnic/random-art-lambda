/**
 * Trigram Context Module
 *
 * Bridges the Trigram domain model with the middleware context composition
 * system for expression-based filename generation. The key design goal is
 * that worker nodes only need the framework's expression system and base
 * model - they don't need Trigram-specific code installed.
 *
 * ## How It Works
 *
 * 1. **Domain Extension as Opaque Memento**: The TrigramPaintTask is a flat
 *    set of domain-specific properties (prefixTrigram, suffixTrigram, indices,
 *    resolvedFileNameExpression, inputEncoding, etc.) derived from the Trigram
 *    spec model. Workers receive it as an opaque `domainExtension` they know
 *    nothing about - it travels through the flow tree without interpretation.
 *
 * 2. **Task Mapping (Producer Side)**: Where Trigram code IS available,
 *    `mapTrigramTaskToContextProperties()` extracts BaseTaskProperties,
 *    DeclaredEncodingProperties, and position properties from the
 *    TrigramPaintTask. This is the only point where Trigram-specific
 *    knowledge is required.
 *
 * 3. **Context Assembly (Worker Side)**: On the worker node, the context is
 *    assembled using only framework-provided parts:
 *    - BaseTaskPart: Provides seedPrefix, seedSuffix, taskId, etc.
 *    - DeclareEncodingPart: Provides inputEncoding for term reconstruction
 *    - BuiltInFunctionsPart: Provides prefixAndSuffixHash() method
 *    - TermFunctionsPart: Reconstructs original terms from binary + encoding
 *    - Position parts: Provide task/term group and element indices
 *    - HashBasedPathPart: Computes pathName using expressions
 *
 * 4. **Expression Evaluation**: The pathName is computed using an expression
 *    (e.g., `${_methods.prefixAndSuffixHash()}.png`) that evaluates entirely
 *    within the framework without needing any Trigram-specific code.
 *
 * ## Usage Example
 *
 * ```typescript
 * // On the producer side (Trigram code available):
 * const mapping = mapTrigramTaskToContextProperties(trigramTask, ...)
 *
 * // On the worker side (framework only):
 * const context = contextFactory.create(mapping.baseTask)
 * console.log(context.context.pathName)  // e.g., "abc123XYZ.png"
 * ```
 */
import type { DynamicModule } from "@nestjs/common"
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
   type ProjectPositionProperties,
   type TaskGroupPositionProperties,
   type TermPositionProperties,
   type IFileStore,
   // Registry for custom parts
   type ContextPartConstructor,
} from "../../../painting/middleware/context/index.js"
import type { FileNameExpressionConfig } from "../../../painting/middleware/expression/FileNameExpressionConfig.js"
import type { DeclaredEncodingProperties } from "../../../painting/permutation/context/parts/DeclareEncodingPart.js"
import {
   createPermutationContextModule,
   type PermutationContextModuleOptions,
} from "../../../painting/permutation/compose/PermutationContextModuleFactory.js"

import type { PaintTaskId } from "../../../painting/messages/values/PaintTaskId.js"
import type { PaintResolution } from "../../../painting/messages/values/PaintResolution.js"
import type { SpatialBoundary } from "../../../painting/messages/values/SpatialBoundary.js"
import { SeedEncodingUtil } from "../../../messages/components/SeedEncodingUtil.js"

// ============================================================================
// Trigram Expression Configuration
// ============================================================================

/**
 * Default expression configuration for the Trigram domain.
 *
 * Falls back to hash-based filenames when no expression is provided.
 * All three runtime levels (module, project, permutation) are optional,
 * allowing progressive override.
 *
 * Exported for use by PermutationExpander when resolving expressions.
 */
export const TRIGRAM_EXPRESSION_CONFIG: FileNameExpressionConfig = {
   defaultExpression: "${_methods.prefixAndSuffixHash()}.png",
   moduleLevel: "optional",
   projectLevel: "optional",
   permutationLevel: "optional",
}

// ============================================================================
// Task Mapping (Producer Side - Trigram code available)
// ============================================================================

/**
 * Result of mapping a TrigramPaintTask to context properties.
 * Separates base task properties from encoding declaration,
 * position indices, and project identity.
 */
export interface TrigramContextMapping {
   /** Core task properties (seeds, resolution, region map) */
   readonly baseTask: BaseTaskProperties
   /** Declared input encoding for term reconstruction (L2) */
   readonly declaredEncoding: DeclaredEncodingProperties
   /** Project position (flat ordinal + region map index) */
   readonly projectPosition: ProjectPositionProperties
   /** Task group position (group index, type, task-within-group index) */
   readonly taskGroupPosition: TaskGroupPositionProperties
   /** Term position (prefix/suffix element indices within group) */
   readonly termPosition: TermPositionProperties
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
 * @returns TrigramContextMapping with base properties, encoding, positions, and optional project identity
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
   const inputEncoding: BufferEncoding = task.inputEncoding ?? "utf-8"

   const baseTask: BaseTaskProperties = {
      taskId,
      seedPrefix: SeedEncodingUtil.fromEncodedPrefix(
         task.prefixTrigram,
         inputEncoding,
      ),
      seedSuffix: SeedEncodingUtil.fromEncodedSuffix(
         task.suffixTrigram,
         inputEncoding,
      ),
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

   const declaredEncoding: DeclaredEncodingProperties = {
      inputEncoding,
   }

   const projectPosition: ProjectPositionProperties = {
      paintProjectTaskIndex: task.paintProjectTaskIndex,
      regionMapIndex: task.regionMapIndex,
   }

   const taskGroupPosition: TaskGroupPositionProperties = {
      taskGroupIndex: task.termPairSourceIndex,
      taskGroupType: task.termPairSourceType,
      groupedTaskIndex: task.termPairIndex,
   }

   const termPosition: TermPositionProperties = {
      groupedPrefixIndex: task.prefixIndex,
      groupedSuffixIndex: task.suffixIndex,
   }

   const projectIdentity: ProjectIdentityProperties | undefined =
      projectSpec != null ? { projectId: projectSpec.projectId } : undefined

   return {
      baseTask,
      declaredEncoding,
      projectPosition,
      taskGroupPosition,
      termPosition,
      projectIdentity,
   }
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
// Dynamic Context Module Factory (Expression-Aware)
// ============================================================================

/**
 * Create a Trigram context module with expression-resolved path naming.
 *
 * Delegates to the L3 `createPermutationContextModule()` factory,
 * providing Trigram-specific defaults (hash-based fallback expression).
 *
 * Use this when you want expression-based filenames instead of the
 * hardcoded hash path. The existing static modules above remain
 * available for backward compatibility.
 *
 * @param options - Expression overrides and feature flags
 * @returns A module with `forRoot()` method
 *
 * @example
 * ```typescript
 * // Use term-based filenames instead of hashes:
 * const ContextModule = createTrigramContextModule({
 *    permutationExpression: '${_methods.prefixTerm()}_${_methods.suffixTerm()}.png',
 *    includeProjectIdentity: true,
 *    includeProjectPosition: true,
 *    includeTaskGroupPosition: true,
 *    includeTermPosition: true,
 * })
 *
 * @Module({ imports: [ContextModule.forRoot()] })
 * export class WorkerModule {}
 * ```
 */
export function createTrigramContextModule(
   options?: PermutationContextModuleOptions,
): { forRoot: () => DynamicModule } {
   return createPermutationContextModule(TRIGRAM_EXPRESSION_CONFIG, options)
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export {
   CONTEXT_FACTORY_TOKEN,
   FILE_STORE_TOKEN,
   type IContextFactory,
   type BaseTaskProperties,
   type ProjectIdentityProperties,
   type ProjectPositionProperties,
   type TaskGroupPositionProperties,
   type TermPositionProperties,
   type IFileStore,
   type DeclaredEncodingProperties,
}

// ============================================================================
// Example Usage (for documentation)
// ============================================================================

/**
 * Example showing how a worker would use the context.
 *
 * ```typescript
 * // In your NestJS module (hash-based, backward compatible):
 * @Module({
 *    imports: [TrigramBasicContextModule.forRoot()],
 * })
 * export class WorkerModule {}
 *
 * // Or with expression-based filenames:
 * const ExprModule = createTrigramContextModule({
 *    permutationExpression: '${_methods.prefixTerm()}_${_methods.suffixTerm()}.png',
 * })
 *
 * @Module({ imports: [ExprModule.forRoot()] })
 * export class ExpressionWorkerModule {}
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
 *       // Hash mode: "qJ7x2P8kLmN.png"
 *       // Expression mode: "☰☱_☲☳.png"
 *    }
 * }
 * ```
 */
