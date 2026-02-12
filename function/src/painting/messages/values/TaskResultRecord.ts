/**
 * Generic task result that Activity Units return.
 *
 * The TReport type parameter allows each Activity Unit to define
 * its own report structure, composing from building blocks as needed.
 *
 * @example
 * // S3 staging activity returns S3-specific report
 * type S3StagingResult = TaskResultRecord<S3StagingReport>
 *
 * // Local staging returns local paths
 * type LocalStagingResult = TaskResultRecord<LocalStagingReport>
 *
 * // IPFS pinning returns CID info
 * type IPFSPinResult = TaskResultRecord<{ cid: string; pinned: boolean }>
 */
export interface TaskResultRecord<TReport = unknown> {
   outcomeType: OutcomeType
   reportIfCompleted?: TReport
   errorIfFailed?: string
}

/**
 * Outcome categories for task execution.
 */
export enum OutcomeType {
   /** Task completed successfully */
   OK = 0,
   /** Task was intentionally skipped (e.g., filtered out) */
   IGNORED = 1,
   /** Task failed due to semantic/validation error */
   SEMANTIC_ERROR = 2,
   /** Task failed due to fatal error (infrastructure, etc.) */
   FATAL_ERROR = 3,
   /** Task exhausted retry attempts */
   OUT_OF_RETRIES = 4,
}

// ============================================================================
// Building Blocks for Report Types
// ============================================================================
// Activity Units compose these as needed for their specific report structures.

/**
 * Reference to an object in S3.
 */
export interface S3BucketAndKey {
   readonly bucket: string
   readonly key: string
}

/**
 * Report fragment for S3-only storage.
 */
export interface S3StagingReport {
   readonly primaryObject: S3BucketAndKey
   readonly extraCopies?: S3BucketAndKey[]
   readonly fileSizeKb: number
}

/**
 * Report fragment for local filesystem storage.
 */
export interface LocalStagingReport {
   readonly primaryPath: string
   readonly hardLinks?: string[]
   readonly extraCopies?: string[]
   readonly fileSizeKb: number
}

/**
 * Report fragment for dual S3 + local storage.
 */
export interface DualStagingReport {
   readonly primaryPath: string
   readonly primaryObject: S3BucketAndKey
   readonly hardLinks?: string[]
   readonly extraCopies?: string[]
   readonly extraObjects?: S3BucketAndKey[]
   readonly fileSizeKb: number
}

// ============================================================================
// Legacy types preserved for migration
// ============================================================================

/** @deprecated Use S3StagingReport instead */
export interface S3BucketKeys {
   readonly fileStore: "s3"
   readonly primaryObject: S3BucketAndKey
   readonly extraCopies?: S3BucketAndKey[]
}

/** @deprecated Use LocalStagingReport instead */
export interface LocalPaths {
   readonly fileStore: "local"
   readonly primaryPath: string
   readonly hardLinks?: string[]
   readonly extraCopies?: string[]
}

/** @deprecated Use DualStagingReport instead */
export interface S3AndLocal {
   readonly fileStore: "s3Local"
   readonly primaryPath: string
   readonly primaryObject: S3BucketAndKey
   readonly hardLinks?: string[]
   readonly extraCopies?: string[]
   readonly extraObjects?: S3BucketAndKey[]
}

/** @deprecated Union type replaced by generic TReport */
export type LocationAndKeys = S3BucketKeys | S3AndLocal | LocalPaths
