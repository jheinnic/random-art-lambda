/**
 * Middleware Handlers
 *
 * Expression-based middleware:
 * - NameByMiddleware: Generate filenames via expressions
 * - GroupByMiddleware: Generate group IDs via expressions
 * - FilterByMiddleware: Boolean filtering via expressions
 *
 * Generic storage middleware:
 * - FileStoreMiddleware: Works with any IFileStore implementation (S3, Local, etc.)
 *
 * Moved to attic/:
 * - CacheRenderedImageMiddleware (LRU cache concept abandoned)
 * - ContentHashFileNamerMiddleware -> Use NameByMiddleware with hash() expression
 * - ContentSizeFilterMiddleware -> Use FilterByMiddleware with buffer.length expression
 * - S3StorageHandlerMiddleware -> Use FileStoreMiddleware with S3FileStore
 * - LocalStorageHandlerMiddleware -> Use FileStoreMiddleware with LocalFileStore
 */

// Expression-based middleware
export * from "./NameByMiddleware.js"
export * from "./GroupByMiddleware.js"
export * from "./FilterByMiddleware.js"

// Generic storage middleware
export * from "./FileStoreMiddleware.js"
