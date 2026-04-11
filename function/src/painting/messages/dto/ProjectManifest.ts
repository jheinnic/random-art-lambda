/**
 * Project Manifest
 *
 * Summary document written to the project content directory root
 * after all tasks in a project have completed. Contains an index
 * of all permutation data sets and what files they produced.
 *
 * Written as `{projectId}/project-manifest.json` by the project
 * gathering worker (root of the FlowProducer tree).
 */

import type { PaintProjectId } from "../values/PaintProjectId.js"
import type { PaintTaskId } from "../values/PaintTaskId.js"
import {
   OutcomeType,
   type S3BucketAndKey,
} from "../values/TaskResultRecord.js"
import type { GatherProjectTasksResult } from "./GatherProjectTasksResult.js"

/** Well-known filename for the project manifest */
export const PROJECT_MANIFEST_FILENAME = "project-manifest.json"

/**
 * Complete project manifest summarizing all task outcomes and
 * their produced files.
 *
 * @typeParam PaintingDomain - Domain extension type (e.g., TrigramPaintTask)
 * @typeParam ProjectDomain - Project domain type (e.g., TrigramPaintProject)
 */
export interface ProjectManifest<
   PaintingDomain extends object = object,
   ProjectDomain extends object = object,
> {
   /** Project identifier assigned by the flow producer */
   readonly projectId: PaintProjectId

   /** ISO timestamp when the manifest was generated */
   readonly generatedAt: string

   /** Aggregate outcome counters for the project */
   readonly counters: GatherProjectTasksResult["counters"]

   /** Project-level domain model from the original submission */
   readonly projectDomain: ProjectDomain

   /** Per-task entries with outcome, domain data, and file locations */
   readonly tasks: ProjectManifestEntry<PaintingDomain>[]
}

/**
 * Individual task entry within the project manifest.
 *
 * Contains the task outcome, the echoed domain extension from the
 * paint task, and the file location where the image was staged.
 */
export interface ProjectManifestEntry<
   PaintingDomain extends object = object,
> {
   /** Task identifier assigned by the flow producer */
   readonly taskId: PaintTaskId

   /** Outcome of this task */
   readonly outcomeType: OutcomeType

   /** Domain extension echoed from the paint task */
   readonly domainExtension?: PaintingDomain

   /** Region map name used for this task */
   readonly regionMapName?: string

   /** File location where the image was staged */
   readonly stagedFile?: StagedFileRef

   /** Error message if the task failed */
   readonly errorIfFailed?: string
}

/**
 * Reference to a staged file, supporting both local and S3 storage.
 */
export interface StagedFileRef {
   /** Local filesystem path (from LocalStagingReport) */
   readonly path?: string

   /** S3 object reference (from S3StagingReport) */
   readonly s3?: S3BucketAndKey

   /** File size in kilobytes */
   readonly fileSizeKb?: number
}
