import { Injectable, Logger } from "@nestjs/common"
import { createWriteStream } from "fs"
import { mkdir } from "fs/promises"
import { dirname, join } from "path"
import { createHash } from "crypto"
import type { IImageStager, StagingContext } from "../interface/IImageStager.js"
import {
   OutcomeType,
   type TaskResultRecord,
   type LocalStagingReport,
} from "../../messages/values/TaskResultRecord.js"

/**
 * Configuration for local filesystem staging
 */
export interface LocalStagerConfig {
   /** Root path for storing staged images (filesystem path or S3 prefix) */
   readonly rootPath: string
}

/**
 * Local filesystem image stager for development and testing.
 *
 * Same interface as S3ImageStager - the GatheringWorker doesn't
 * know or care which one is injected.
 */
@Injectable()
export class LocalImageStager implements IImageStager<LocalStagingReport> {
   private readonly logger = new Logger("LocalImageStager")

   constructor(private readonly config: LocalStagerConfig) {}

   async stage(context: StagingContext): Promise<TaskResultRecord<LocalStagingReport>> {
      const { imageData, taskId, projectId, genSeed, width, height } = context

      try {
         // Same deterministic filename logic as S3
         const seedHash = this.hashSeeds(genSeed.seedPrefix, genSeed.seedSuffix)
         const filename = this.buildFilename(seedHash, projectId)
         const outputPath = join(this.config.rootPath, filename)

         this.logger.log(
            `Staging image for task ${taskId}: ${outputPath} (${width}x${height})`,
         )

         // Ensure directory exists
         await mkdir(dirname(outputPath), { recursive: true })

         // Write the image
         await this.writeFile(outputPath, imageData)

         this.logger.log(`Successfully staged: ${outputPath}`)

         return {
            outcomeType: OutcomeType.OK,
            reportIfCompleted: {
               primaryPath: outputPath,
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

   private hashSeeds(prefix: string, suffix: string): string {
      const combined = `${prefix}:${suffix}`
      return createHash("sha256").update(combined).digest("hex").slice(0, 16)
   }

   private buildFilename(seedHash: string, projectId?: string): string {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      if (projectId) {
         return `${projectId}/${seedHash}-${timestamp}.png`
      }
      return `${seedHash}-${timestamp}.png`
   }

   private writeFile(path: string, data: Buffer): Promise<void> {
      return new Promise((resolve, reject) => {
         const stream = createWriteStream(path)
         stream.on("finish", resolve)
         stream.on("error", reject)
         stream.write(data)
         stream.end()
      })
   }
}
