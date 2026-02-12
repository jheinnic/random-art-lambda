import { Readable } from "stream"

/**
 * Storage abstraction for persisting data.
 *
 * @deprecated Use IFileStore instead for new code.
 * This interface exists for backward compatibility during migration.
 *
 * Supports both buffer-based and stream-based writes.
 */
export interface IResultStore {
   /**
    * Write buffer data to storage.
    *
    * @param path - Storage path (relative for local, or full S3 key for S3)
    * @param data - Binary data
    * @param contentType - MIME type (optional, e.g., "image/png")
    * @returns Promise resolving to the storage location (file path or S3 URI)
    * @deprecated Use IFileStore.write() with FileMetadata instead
    */
   write(path: string, data: Buffer, contentType?: string): Promise<string>

   /**
    * Write stream data to storage.
    *
    * @param path - Storage path
    * @param stream - Readable stream (e.g., from canvas.createPNGStream())
    * @param contentType - MIME type (optional, e.g., "image/png")
    * @returns Promise resolving to the storage location
    * @deprecated Stream writing should buffer and use IFileStore.write()
    */
   writeStream(
      path: string,
      stream: Readable,
      contentType?: string,
   ): Promise<string>

   /**
    * Check if a path exists in storage.
    *
    * @param path - Storage path to check
    * @returns Promise resolving to true if exists
    * @deprecated Use IFileStore.exists() instead
    */
   exists(path: string): Promise<boolean>
}
