import { DynamicModule, Module } from "@nestjs/common"
import { AwsS3ResultStore } from "../components/AwsS3ResultStore.js"

export interface AwsS3StorageModuleConfig {
   /**
    * Custom injection token to export the ResultStore under.
    * Allows multiple independent storage instances in the same application.
    *
    * @example
    * const PAINT_RESULT_STORE = Symbol("PaintResultStore")
    * const ARTIFACT_STORE = Symbol("ArtifactStore")
    */
   exportToken: symbol

   /**
    * S3 bucket name (required)
    */
   s3Bucket: string

   /**
    * S3 region (optional, defaults to AWS SDK default)
    */
   s3Region?: string

   /**
    * Base path prefix for S3 keys (optional)
    */
   s3Prefix?: string

   /**
    * Multipart upload chunk size in bytes (optional, defaults to 5MB)
    * Only used for streams. Buffers always use single PutObject.
    */
   s3PartSize?: number
}

/**
 * S3 storage module using AWS SDK v3 directly.
 *
 * Features:
 * - True streaming uploads (no buffering required)
 * - Automatic multipart upload for large streams
 * - Configurable chunk size
 * - Efficient memory usage
 */
@Module({})
export class AwsS3StorageModule {
   static forRoot(config: AwsS3StorageModuleConfig): DynamicModule {
      const providers = [
         {
            provide: config.exportToken,
            useFactory: () => {
               return new AwsS3ResultStore({
                  bucket: config.s3Bucket,
                  region: config.s3Region,
                  prefix: config.s3Prefix,
                  partSize: config.s3PartSize,
               })
            },
         },
      ]

      return {
         module: AwsS3StorageModule,
         providers,
         exports: [config.exportToken],
      }
   }
}
