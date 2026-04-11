import { DynamicModule, Module } from "@nestjs/common"
import type { FileStore } from "@aztec/stdlib/file-store"
import { createFileStore } from "@aztec/stdlib/file-store"
import { S3ResultStore } from "../components/S3ResultStore.js"

export interface S3StorageModuleConfig {
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
}

/**
 * S3-only storage module.
 * Creates a ResultStore that writes to S3 using @aztec/stdlib FileStore.
 *
 * Note: Uses buffer-based writes (not streaming) due to FileStore limitations.
 */
@Module({})
export class S3StorageModule {
   static forRoot(config: S3StorageModuleConfig): DynamicModule {
      // Internal token for the FileStore instance
      const fileStoreToken = Symbol(
         `FileStore_${config.exportToken.toString()}`,
      )

      const providers = [
         {
            provide: fileStoreToken,
            useFactory: async (): Promise<FileStore> => {
               // Build FileStore config string
               const configStr = `s3://${config.s3Bucket}`
               return await createFileStore(configStr)
            },
         },
         {
            provide: config.exportToken,
            useFactory: (fileStore: FileStore) => {
               return new S3ResultStore(fileStore)
            },
            inject: [fileStoreToken],
         },
      ]

      return {
         module: S3StorageModule,
         providers,
         exports: [config.exportToken],
      }
   }
}
