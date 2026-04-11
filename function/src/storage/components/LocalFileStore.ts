import { Injectable, Logger } from "@nestjs/common"
import { IFileStore, FileMetadata } from "../interface/IFileStore.js"
import { writeFile, readFile, unlink, access, mkdir } from "fs/promises"
import { constants } from "fs"
import { dirname } from "path"
import { classifyFilesystemError } from "../errors/LocalStorageError.js"

/**
 * Local filesystem IFileStore implementation.
 *
 * Throws typed StorageError subclasses:
 * - FilesystemInvalidPathError
 * - FilesystemPermissionError
 * - FilesystemNoSpaceError
 * - FilesystemResourceBusyError (retryable)
 */
@Injectable()
export class LocalFileStore implements IFileStore {
   private readonly logger = new Logger(LocalFileStore.name)

   constructor(private readonly baseDirectory: string = process.cwd()) {}

   async write(
      path: string,
      data: Buffer,
      _metadata?: FileMetadata,
   ): Promise<string> {
      this.logger.log(`Writing ${data.length} bytes to local: ${path}`)

      try {
         await mkdir(dirname(path), { recursive: true })
         await writeFile(path, data)
         this.logger.log(`Wrote to local: ${path}`)
         return path
      } catch (error) {
         throw classifyFilesystemError(error as Error, path)
      }
   }

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

   async delete(path: string): Promise<void> {
      this.logger.log(`Deleting from local: ${path}`)

      try {
         await unlink(path)
         this.logger.log(`Deleted from local: ${path}`)
      } catch (error) {
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

   getBaseUri(): string {
      return `file://${this.baseDirectory}`
   }
}
