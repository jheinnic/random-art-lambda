/**
 * RA-Provided Context Parts
 *
 * These are reusable context parts provided by the Random Art framework
 * for common middleware composition scenarios.
 *
 * ## Core Parts
 *
 * - **BaseTaskPart**: Core task properties (seeds, resolution, boundaries)
 * - **BuiltInFunctionsPart**: Expression functions (hash, encode, etc.)
 * - **InjectedFileStorePart**: File storage via NestJS DI
 * - **PathNamingPart**: Expression-based filename generation
 *
 * ## Usage Example
 *
 * ```typescript
 * import {
 *    BaseTaskPart,
 *    BuiltInFunctionsPart,
 *    InjectedFileStorePart,
 *    HashBasedPathPart,
 *    FILE_STORE_TOKEN,
 * } from "./parts/index.js"
 *
 * const PaintingContextModule = MiddlewareContextModuleBuilder
 *    .create("PaintingContext")
 *    .addParts([
 *       BaseTaskPart,        // Provides seedPrefix, seedSuffix, etc.
 *       BuiltInFunctionsPart, // Provides hash functions
 *       InjectedFileStorePart, // Provides file storage
 *       HashBasedPathPart,    // Computes pathName from hash
 *    ])
 *    .withDependency(FILE_STORE_TOKEN, S3FileStore)
 *    .build()
 * ```
 */

// ============================================================================
// Base Task Part
// ============================================================================

export {
   // Abstract contract
   HasBaseTask,
   // Concrete provider
   BaseTaskPart,
   // Helper
   createBaseTaskContext,
   // Types
   type BaseTaskProperties,
} from "./BaseTaskPart.js"

// ============================================================================
// Project Identity Part
// ============================================================================

export {
   // Abstract contract
   HasProjectIdentity,
   // Concrete provider
   ProjectIdentityPart,
   // Helper
   createProjectIdentityContext,
   // Types
   type ProjectIdentityProperties,
} from "./ProjectIdentityPart.js"

// ============================================================================
// Built-In Functions Part
// ============================================================================

export {
   // Abstract contract
   HasBuiltInFunctions,
   // Concrete provider
   BuiltInFunctionsPart,
   // Types
   type BuiltInMethods,
} from "./BuiltInFunctionsPart.js"

// ============================================================================
// File Store Part
// ============================================================================

export {
   // Abstract contract
   HasFileStore,
   // Concrete provider
   InjectedFileStorePart,
   // Injection token
   FILE_STORE_TOKEN,
   // Re-exported types
   type IFileStore,
   type FileMetadata,
} from "./FileStorePart.js"

// ============================================================================
// Path Naming Part
// ============================================================================

export {
   // Abstract contract
   HasPathName,
   // Concrete providers
   HashBasedPathPart,
   ProjectPathPart,
   // Factories
   createPathPart,
   createPathPartFromTemplate,
} from "./PathNamingPart.js"
