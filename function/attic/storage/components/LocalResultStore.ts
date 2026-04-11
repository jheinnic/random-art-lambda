import { Injectable, Logger } from "@nestjs/common"
import { IResultStore } from "../interface/IResultStore.js"
import { IFileStore, FileMetadata } from "../interface/IFileStore.js"
import { createWriteStream } from "fs"
import { writeFile, readFile, unlink, access, mkdir } from "fs/promises"
import { constants } from "fs"
import { dirname } from "path"
import { Readable } from "stream"
import { pipeline } from "stream/promises"
import { classifyFilesystemError } from "../errors/LocalStorageError.js"

/**
 * Local filesystem-only result store.
 *
 * Implements both IFileStore (new unified interface) and IResultStore (legacy).
 *
 * Supports both buffer and stream writes with automatic directory creation.
 *
 * Throws typed StorageError subclasses with built-in classification:
 * - FilesystemInvalidPathError - invalid path per OS spec
 * - FilesystemPermissionError - permission denied
 * - FilesystemNoSpaceError - disk full
 * - FilesystemResourceBusyError - too many open files (retryable)
 */
@Injectable()
export class LocalResultStore implements IResultStore, IFileStore {
   private readonly logger = new Logger(LocalResultStore.name)

   constructor(private readonly baseDirectory: string = process.cwd()) {}

   // Overload signatures for both interfaces
   async write(path: string, data: Buffer, contentType?: string): Promise<string>
   async write(path: string, data: Buffer, metadata?: FileMetadata): Promise<string>

   // Unified implementation
   async write(
      path: string,
      data: Buffer,
      metadataOrContentType?: FileMetadata | string,
   ): Promise<string> {
      this.logger.log(`Writing ${data.length} bytes to local: ${path}`)

      // Normalize to FileMetadata (though local filesystem doesn't use it)
      let _metadata: FileMetadata | undefined
      if (typeof metadataOrContentType === "string") {
         // IResultStore call: write(path, data, contentType)
         _metadata = { contentType: metadataOrContentType }
      } else {
         // IFileStore call: write(path, data, metadata)
         _metadata = metadataOrContentType
      }
      // Note: Local filesystem doesn't store metadata, so we ignore it

      try {
         // Ensure parent directory exists
         const dir = dirname(path)
         await mkdir(dir, { recursive: true })

         // Write buffer to file
         await writeFile(path, data)

         this.logger.log(`Wrote to local: ${path}`)
         return path
      } catch (error) {
         // Classify and re-throw as typed StorageError
         throw classifyFilesystemError(error as Error, path)
      }
   }

   // IFileStore method - read file from local filesystem
   async read(path: string): Promise<Buffer> {
      this.logger.log(`Reading from local: ${path}`)

      try {
         const data = await readFile(path)
         this.logger.log(`Read ${data.length} bytes from local: ${path}`)
         return data
      } catch (error) {
         throw classifyFilesystemError(error as Error, path)
      }
   }

   // IFileStore method - delete file from local filesystem
   async delete(path: string): Promise<void> {
      this.logger.log(`Deleting from local: ${path}`)

      try {
         await unlink(path)
         this.logger.log(`Deleted from local: ${path}`)
      } catch (error) {
         throw classifyFilesystemError(error as Error, path)
      }
   }

   // IFileStore method - get base URI
   getBaseUri(): string {
      return `file://${this.baseDirectory}`
   }

   async writeStream(
      path: string,
      stream: Readable,
      _contentType?: string,
   ): Promise<string> {
      this.logger.log(`Writing stream to local: ${path}`)

      try {
         // Ensure parent directory exists
         const dir = dirname(path)
         await mkdir(dir, { recursive: true })

         // Pipe stream to file
         const writeStream = createWriteStream(path)
         await pipeline(stream, writeStream)

         this.logger.log(`Wrote stream to local: ${path}`)
         return path
      } catch (error) {
         // Classify and re-throw as typed StorageError
         throw classifyFilesystemError(error as Error, path)
      }
   }

   async exists(path: string): Promise<boolean> {
      try {
         await access(path, constants.F_OK)
         return true
      } catch {
         return false
      }
   }
}
