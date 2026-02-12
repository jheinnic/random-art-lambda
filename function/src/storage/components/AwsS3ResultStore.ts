import { Injectable, Logger } from "@nestjs/common"
import {
   S3Client,
   PutObjectCommand,
   HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { IResultStore } from "../interface/IResultStore.js"
import { Readable } from "stream"

export interface AwsS3Config {
   /**
    * S3 bucket name
    */
   bucket: string

   /**
    * AWS region (optional, defaults to SDK default or AWS_REGION env var)
    */
   region?: string

   /**
    * Custom S3 endpoint URL
    */
   endpoint?: string

   /**
    * Optional path prefix for all keys
    */
   prefix?: string

   /**
    * Multipart upload chunk size in bytes (default: 5MB)
    * Only used for streams. Buffers always use single PutObject.
    */
   partSize?: number
}

/**
 * S3 result store using AWS SDK v3 directly.
 *
 * Features:
 * - True streaming uploads (no buffering required)
 * - Automatic multipart upload for large streams
 * - Configurable chunk size
 * - Efficient memory usage
 */
@Injectable()
export class AwsS3ResultStore implements IResultStore {
   private readonly logger = new Logger(AwsS3ResultStore.name)
   private readonly s3Client: S3Client
   private readonly bucket: string
   private readonly prefix: string
   private readonly partSize: number

   constructor(config: AwsS3Config) {
      this.bucket = config.bucket
      this.prefix = config.prefix ?? ""
      this.partSize = config.partSize ?? 5 * 1024 * 1024 // 5MB default

      this.s3Client = new S3Client({
         region: config.region,
      })
   }

   async write(
      path: string,
      data: Buffer,
      contentType?: string,
   ): Promise<string> {
      const key = this.buildKey(path)
      this.logger.log(`Writing ${data.length} bytes to S3: ${key}`)

      // For buffers, use simple PutObject (not multipart)
      const command = new PutObjectCommand({
         Bucket: this.bucket,
         Key: key,
         Body: data,
         ContentType: contentType,
      })

      await this.s3Client.send(command)

      const uri = `s3://${this.bucket}/${key}`
      this.logger.log(`Wrote to S3: ${uri}`)
      return uri
   }

   async writeStream(
      path: string,
      stream: Readable,
      contentType?: string,
   ): Promise<string> {
      const key = this.buildKey(path)
      this.logger.log(`Writing stream to S3: ${key}`)

      // Use @aws-sdk/lib-storage Upload for true streaming with multipart
      const upload = new Upload({
         client: this.s3Client,
         params: {
            Bucket: this.bucket,
            Key: key,
            Body: stream,
            ContentType: contentType,
         },
         // Configure multipart upload
         partSize: this.partSize,
         queueSize: 4, // Upload up to 4 parts concurrently
      })

      // Execute the upload
      await upload.done()

      const uri = `s3://${this.bucket}/${key}`
      this.logger.log(`Wrote stream to S3: ${uri}`)
      return uri
   }

   async exists(path: string): Promise<boolean> {
      const key = this.buildKey(path)
      try {
         const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
         })
         await this.s3Client.send(command)
         return true
      } catch (error: any) {
         if (
            error.name === "NotFound" ||
            error.$metadata?.httpStatusCode === 404
         ) {
            return false
         }
         throw error
      }
   }

   private buildKey(path: string): string {
      // Remove leading slash if present
      const cleanPath = path.startsWith("/") ? path.slice(1) : path

      // Combine prefix and path
      if (this.prefix) {
         const cleanPrefix = this.prefix.endsWith("/")
            ? this.prefix
            : `${this.prefix}/`
         return `${cleanPrefix}${cleanPath}`
      }

      return cleanPath
   }
}
