import type { PaintedData } from "../../../messages/interface/NamedValues.js"
import type { GenModelSeed, PaintTaskId, PaintProjectId } from "../../messages/values/index.js"
import type { TaskResultRecord } from "../../messages/values/TaskResultRecord.js"

/**
 * Context passed to the image stager containing all information
 * needed to stage an image. The stager decides HOW to stage it
 * (local, S3, etc.) and how to name it.
 */
export interface StagingContext {
   /** The rendered image data ready to be staged */
   readonly imageData: PaintedData

   /** Task identity for tracking/correlation */
   readonly taskId: PaintTaskId

   /** Optional project grouping */
   readonly projectId?: PaintProjectId

   /** Seed data - stager can use this for filename generation */
   readonly genSeed: GenModelSeed

   /** Image dimensions for metadata */
   readonly width: number
   readonly height: number
}

/**
 * Abstract interface for staging rendered images.
 *
 * The GatheringWorker depends on this interface, not the concrete
 * implementation. This allows swapping S3 for local filesystem,
 * mock implementations for testing, etc.
 *
 * @typeParam TReport - The report type this stager produces.
 *                      Each implementation defines its own report structure.
 */
export interface IImageStager<TReport = unknown> {
   /**
    * Stage the rendered image and return a result record
    * describing where it was placed.
    *
    * @param context - All information needed to stage the image
    * @returns A TaskResultRecord with implementation-specific report
    */
   stage(context: StagingContext): Promise<TaskResultRecord<TReport>>
}

// Note: Injection token is in di/Types.ts as StagingModuleTypes.IImageStager
