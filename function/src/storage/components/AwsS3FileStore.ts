import { Injectable, Logger } from "@nestjs/common"
import {
   S3Client,
   PutObjectCommand,
   GetObjectCommand,
   DeleteObjectCommand,
   HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { IFileStore, FileMetadata } from "../interface/IFileStore.js"
import { classifyS3Error } from "../errors/S3StorageError.js"

export interface AwsS3FileStoreConfig {
   /** S3 bucket name */
   bucket: string
   /** AWS region (defaults to SDK default / AWS_REGION env var) */
   region?: string
   /** Optional key prefix for all objects */
   prefix?: string
}

/**
 * S3 IFileStore implementation using AWS SDK v3 directly.
 *
 * No external file-store abstraction layer — plain PutObject / GetObject /
 * DeleteObject / HeadObject commands via @aws-sdk/client-s3.
 */
@Injectable()
export class AwsS3FileStore implements IFileStore {
   private readonly logger = new Logger(AwsS3FileStore.name)
   private readonly s3Client: S3Client
   private readonly bucket: string
   private readonly prefix: string

   constructor(config: AwsS3FileStoreConfig) {
      this.bucket = config.bucket
      this.prefix = config.prefix ?? ""
      this.s3Client = new S3Client({ region: config.region })
   }

   async write(
      path: string,
      data: Buffer,
      metadata?: FileMetadata,
   ): Promise<string> {
      const key = this.buildKey(path)
      this.logger.log(`Writing ${data.length} bytes to S3: ${key}`)

      try {
         await this.s3Client.send(
            new PutObjectCommand({
               Bucket: this.bucket,
               Key: key,
               Body: data,
               ContentType: metadata?.contentType,
               CacheControl: metadata?.cacheControl,
               ContentEncoding: metadata?.contentEncoding,
               Metadata: metadata?.tags,
            }),
         )

         const uri = `s3://${this.bucket}/${key}`
         this.logger.log(`Wrote to S3: ${uri}`)
         return uri
      } catch (error) {
         throw classifyS3Error(error as Error, undefined, path)
      }
   }

   async read(path: string): Promise<Buffer> {
      const key = this.buildKey(path)
      this.logger.log(`Reading from S3: ${key}`)

      try {
         const response = await this.s3Client.send(
            new GetObjectCommand({ Bucket: this.bucket, Key: key }),
         )

         if (response.Body == null) {
            throw new Error(`Empty response body for S3 key: ${key}`)
         }

         const chunks: Uint8Array[] = []
         for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
            chunks.push(chunk)
         }
         const data = Buffer.concat(chunks)
         this.logger.log(`Read ${data.length} bytes from S3: ${key}`)
         return data
      } catch (error) {
         throw classifyS3Error(error as Error, undefined, path)
      }
   }

   async delete(path: string): Promise<void> {
      const key = this.buildKey(path)
      this.logger.log(`Deleting from S3: ${key}`)

      try {
         await this.s3Client.send(
            new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
         )
         this.logger.log(`Deleted from S3: ${key}`)
      } catch (error) {
         throw classifyS3Error(error as Error, undefined, path)
      }
   }

   async exists(path: string): Promise<boolean> {
      const key = this.buildKey(path)

      try {
         await this.s3Client.send(
            new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
         )
         return true
      } catch (error: any) {
         if (
            error.name === "NotFound" ||
            error.$metadata?.httpStatusCode === 404
         ) {
            return false
         }
         throw classifyS3Error(error as Error, undefined, path)
      }
   }

   getBaseUri(): string {
      return `s3://${this.bucket}`
   }

   private buildKey(path: string): string {
      const cleanPath = path.startsWith("/") ? path.slice(1) : path
      if (this.prefix) {
         const cleanPrefix = this.prefix.endsWith("/")
            ? this.prefix
            : `${this.prefix}/`
         return `${cleanPrefix}${cleanPath}`
      }
      return cleanPath
   }
}
