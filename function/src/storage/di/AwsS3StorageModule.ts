import { DynamicModule, Module } from "@nestjs/common"
import { AwsS3FileStore } from "../components/AwsS3FileStore.js"

export interface AwsS3StorageModuleConfig {
   /**
    * Injection token to export the IFileStore under.
    */
   exportToken: symbol

   /** S3 bucket name */
   s3Bucket: string

   /** AWS region (defaults to SDK default / AWS_REGION env var) */
   s3Region?: string

   /** Optional key prefix for all objects */
   s3Prefix?: string
}

@Module({})
export class AwsS3StorageModule {
   static forRoot(config: AwsS3StorageModuleConfig): DynamicModule {
      const providers = [
         {
            provide: config.exportToken,
            useFactory: () =>
               new AwsS3FileStore({
                  bucket: config.s3Bucket,
                  region: config.s3Region,
                  prefix: config.s3Prefix,
               }),
         },
      ]

      return {
         module: AwsS3StorageModule,
         providers,
         exports: [config.exportToken],
      }
   }
}
