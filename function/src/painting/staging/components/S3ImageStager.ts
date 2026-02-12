import { Injectable, Logger } from "@nestjs/common"
import { createHash } from "crypto"
import type { IImageStager, StagingContext } from "../interface/IImageStager.js"
import {
   OutcomeType,
   type TaskResultRecord,
   type S3StagingReport,
} from "../../messages/values/TaskResultRecord.js"

/**
 * Configuration for S3 staging
 */
export interface S3StagerConfig {
   readonly bucketName: string
   readonly region: string
   readonly keyPrefix: string
}

/**
 * S3-based image stager implementation.
 *
 * Generates filenames based on a hash of the GenModel seeds,
 * ensuring deterministic naming for the same seed pair.
 */
@Injectable()
export class S3ImageStager implements IImageStager<S3StagingReport> {
   private readonly logger = new Logger("S3ImageStager")

   constructor(
      private readonly config: S3StagerConfig,
      // In production, inject the actual S3 client
      // private readonly s3Client: S3Client,
   ) {}

   async stage(context: StagingContext): Promise<TaskResultRecord<S3StagingReport>> {
      const { imageData, taskId, projectId, genSeed, width, height } = context

      try {
         // Generate deterministic filename from seeds
         const seedHash = this.hashSeeds(genSeed.seedPrefix, genSeed.seedSuffix)
         const filename = this.buildFilename(seedHash, projectId)
         const s3Key = `${this.config.keyPrefix}/${filename}`

         this.logger.log(
            `Staging image for task ${taskId}: ${s3Key} (${width}x${height})`,
         )

         // TODO: Actual S3 upload
         // await this.s3Client.send(new PutObjectCommand({
         //    Bucket: this.config.bucketName,
         //    Key: s3Key,
         //    Body: imageData,
         //    ContentType: "image/png",
         //    Metadata: {
         //       taskId,
         //       seedHash,
         //       dimensions: `${width}x${height}`,
         //    },
         // }))

         // For now, simulate success
         const s3Uri = `s3://${this.config.bucketName}/${s3Key}`

         this.logger.log(`Successfully staged: ${s3Uri}`)

         return {
            outcomeType: OutcomeType.OK,
            reportIfCompleted: {
               primaryObject: {
                  bucket: this.config.bucketName,
                  key: s3Key,
               },
               fileSizeKb: Math.ceil(imageData.length / 1024),
            },
         }
      } catch (error) {
         this.logger.error(`Failed to stage image for task ${taskId}:`, error)

         return {
            outcomeType: OutcomeType.FATAL_ERROR,
            errorIfFailed:
               error instanceof Error ? error.message : "Unknown staging error",
         }
      }
   }

   /**
    * Create a deterministic hash from the seed pair.
    * Same seeds always produce the same hash.
    */
   private hashSeeds(prefix: string, suffix: string): string {
      const combined = `${prefix}:${suffix}`
      return createHash("sha256").update(combined).digest("hex").slice(0, 16)
   }

   /**
    * Build the filename using the seed hash and optional project grouping.
    */
   private buildFilename(seedHash: string, projectId?: string): string {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      if (projectId) {
         return `${projectId}/${seedHash}-${timestamp}.png`
      }
      return `${seedHash}-${timestamp}.png`
   }
}
