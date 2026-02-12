/**
 * File Store Context Part
 *
 * Provides file storage capability to the context composition system.
 * Uses the abstract/concrete provider pattern with NestJS injection.
 */

import {
   ContextPart,
   createInjectedPart,
   type MiddlewareContextConstructor,
   type ContextPartConstructor,
} from "../index.js"
import type { IFileStore, FileMetadata } from "../../../../storage/interface/IFileStore.js"

// ============================================================================
// Injection Token
// ============================================================================

/**
 * NestJS injection token for IFileStore.
 * Application modules should provide this token with their preferred implementation.
 */
export const FILE_STORE_TOKEN = Symbol("IFileStore")

// ============================================================================
// Abstract Contract
// ============================================================================

/**
 * Abstract contract for parts that need file storage capability.
 *
 * Parts depending on this contract will receive an IFileStore implementation
 * through the context's `_context` namespace.
 *
 * @example
 * ```typescript
 * // An activity that stages images
 * const StagingActivity = activityContextualize(
 *    ImageStagingActivity,
 *    ["stagedPath"],
 *    ["fileStore"],
 *    {
 *       name: "StagingActivity",
 *       dependsOn: [HasFileStore],
 *    }
 * )
 * ```
 */
@ContextPart({
   name: "HasFileStore",
   isAbstract: true,
   visibility: "private",
})
export abstract class HasFileStore {
   abstract readonly fileStore: IFileStore
}

// ============================================================================
// Concrete Provider
// ============================================================================

/**
 * Injected FileStore part.
 *
 * This part provides an IFileStore implementation to the context through
 * NestJS dependency injection. The actual implementation (S3, local, etc.)
 * is determined by how the FILE_STORE_TOKEN is bound in the NestJS module.
 *
 * @example
 * ```typescript
 * // In your module
 * const ContextModule = MiddlewareContextModuleBuilder
 *    .create("PaintingContext")
 *    .addParts([BaseTaskPart, InjectedFileStorePart, ...])
 *    .withDependency(FILE_STORE_TOKEN, S3FileStore)
 *    .build()
 * ```
 */
export const InjectedFileStorePart: MiddlewareContextConstructor<object, { fileStore: IFileStore }> =
   createInjectedPart<{ fileStore: IFileStore }>(
      HasFileStore as unknown as ContextPartConstructor,
      {
         name: "InjectedFileStorePart",
         provides: [HasFileStore as unknown as ContextPartConstructor],
         injections: {
            fileStore: FILE_STORE_TOKEN,
         },
      },
   )

// ============================================================================
// Re-export IFileStore types for convenience
// ============================================================================

export type { IFileStore, FileMetadata }
