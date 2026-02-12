/**
 * Dependency injection tokens for file storage.
 *
 * These tokens allow different IFileStore implementations to be injected
 * based on configuration (S3, local filesystem, etc.).
 */

/**
 * Token for S3-backed file storage.
 * Resolves to S3ResultStore instance.
 */
export const S3_FILE_STORE = Symbol('S3_FILE_STORE')

/**
 * Token for local filesystem-backed file storage.
 * Resolves to LocalResultStore instance.
 */
export const LOCAL_FILE_STORE = Symbol('LOCAL_FILE_STORE')

/**
 * Token for the primary file store used by worker nodes.
 * Typically resolves to S3_FILE_STORE for staging.
 */
export const WORKER_FILE_STORE = Symbol('WORKER_FILE_STORE')

/**
 * Token for the file store used by local/origin nodes.
 * May resolve to LOCAL_FILE_STORE or S3_FILE_STORE based on configuration.
 */
export const LOCAL_NODE_FILE_STORE = Symbol('LOCAL_NODE_FILE_STORE')
