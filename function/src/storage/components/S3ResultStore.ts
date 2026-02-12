import { Injectable, Logger } from "@nestjs/common"
import type { FileStore } from "@aztec/stdlib/dest/file-store/interface.js"
import { IResultStore } from "../interface/IResultStore.js"
import { IFileStore, FileMetadata } from "../interface/IFileStore.js"
import { Readable } from "stream"
import { classifyS3Error } from "../errors/S3StorageError.js"

/**
 * S3-only result store using @aztec/stdlib FileStore.
 *
 * Implements both IFileStore (new unified interface) and IResultStore (legacy).
 *
 * Throws typed StorageError subclasses with built-in classification:
 * - S3InvalidInputError - invalid bucket/key per S3 spec
 * - S3BucketNotFoundError - bucket doesn't exist
 * - S3PermissionError - access denied
 * - S3NetworkError - timeout/network issues (retryable)
 *
 * Limitations:
 * - writeStream() buffers entire stream in memory (FileStore limitation)
 * - Uses temp file staging internally
 * - No multipart upload support
 */
@Injectable()
export class S3ResultStore implements IResultStore, IFileStore {
   private readonly logger = new Logger(S3ResultStore.name)

   constructor(
      private readonly fileStore: FileStore,
      private readonly baseUri: string = "s3://",
   ) {}

   // Overload signatures for both interfaces
   async write(path: string, data: Buffer, contentType?: string): Promise<string>
   async write(path: string, data: Buffer, metadata?: FileMetadata): Promise<string>

   // Unified implementation
   async write(
      path: string,
      data: Buffer,
      metadataOrContentType?: FileMetadata | string,
   ): Promise<string> {
      this.logger.log(`Writing ${data.length} bytes to S3: ${path}`)

      // Normalize to FileMetadata
      let metadata: FileMetadata | undefined
      if (typeof metadataOrContentType === "string") {
         // IResultStore call: write(path, data, contentType)
         metadata = { contentType: metadataOrContentType }
      } else {
         // IFileStore call: write(path, data, metadata)
         metadata = metadataOrContentType
      }

      try {
         // @aztec/stdlib FileStore uses save() method for buffer writes
         // Note: This still uses staging internally - not true streaming
         const s3Metadata: Record<string, string> = {}

         if (metadata?.contentType != null) {
            s3Metadata["Content-Type"] = metadata.contentType
         }
         if (metadata?.cacheControl != null) {
            s3Metadata["Cache-Control"] = metadata.cacheControl
         }
         if (metadata?.contentEncoding != null) {
            s3Metadata["Content-Encoding"] = metadata.contentEncoding
         }
         if (metadata?.tags != null) {
            // Merge custom tags into metadata
            Object.assign(s3Metadata, metadata.tags)
         }

         const uri = await this.fileStore.save(path, data, {
            metadata: Object.keys(s3Metadata).length > 0 ? s3Metadata : undefined,
         })

         this.logger.log(`Wrote to S3: ${uri}`)
         return uri
      } catch (error) {
         // Classify and re-throw as typed StorageError
         throw classifyS3Error(error as Error, undefined, path)
      }
   }

   // IFileStore method - read file from S3
   async read(path: string): Promise<Buffer> {
      this.logger.log(`Reading from S3: ${path}`)

      try {
         const data = await this.fileStore.read(path)
         this.logger.log(`Read ${data.length} bytes from S3: ${path}`)
         return data
      } catch (error) {
         throw classifyS3Error(error as Error, undefined, path)
      }
   }

   // IFileStore method - delete file from S3
   async delete(path: string): Promise<void> {
      this.logger.log(`Deleting from S3: ${path}`)

      // Note: @aztec/stdlib FileStore doesn't provide delete functionality
      // This would require direct S3 client access
      throw new Error("S3 delete not implemented - FileStore doesn't support deletion")
   }

   // IFileStore method - check file exists
   async exists(path: string): Promise<boolean> {
      try {
         return await this.fileStore.exists(path)
      } catch {
         return false
      }
   }

   // IFileStore method - get base URI
   getBaseUri(): string {
      return this.baseUri
   }

   // IResultStore legacy method - writeStream
   async writeStream(
      path: string,
      stream: Readable,
      contentType?: string,
   ): Promise<string> {
      this.logger.log(`Writing stream to S3: ${path}`)

      // FileStore doesn't support true streaming, so we must buffer
      const chunks: Buffer[] = []
      for await (const chunk of stream) {
         chunks.push(Buffer.from(chunk))
      }
      const data = Buffer.concat(chunks)

      // Now write the buffered data
      return await this.write(path, data, contentType ? { contentType } : undefined)
   }
}
