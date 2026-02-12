/**
 * Unified file storage interface.
 *
 * Implementations handle specific storage backends (S3, local filesystem, etc.)
 * and throw StorageError instances for error classification.
 */
export interface IFileStore {
   /**
    * Write a file to storage.
    *
    * @param path - Relative path within the storage backend
    * @param data - File contents as Buffer
    * @param metadata - Optional metadata (content type, tags, etc.)
    * @returns Full URI to the stored file
    * @throws StorageError with isRetryable() classification
    */
   write: (
      path: string,
      data: Buffer,
      metadata?: FileMetadata,
   ) => Promise<string>

   /**
    * Read a file from storage.
    *
    * @param path - Relative path within the storage backend
    * @returns File contents as Buffer
    * @throws StorageError with isRetryable() classification
    */
   read: (path: string) => Promise<Buffer>

   /**
    * Delete a file from storage.
    *
    * @param path - Relative path within the storage backend
    * @throws StorageError with isRetryable() classification
    */
   delete: (path: string) => Promise<void>

   /**
    * Check if a file exists in storage.
    *
    * @param path - Relative path within the storage backend
    * @returns True if file exists, false otherwise
    * @throws StorageError with isRetryable() classification
    */
   exists: (path: string) => Promise<boolean>

   /**
    * Get the base URI for this storage backend.
    * Used to construct full URIs from relative paths.
    */
   getBaseUri: () => string
}

/**
 * Optional metadata that can be attached to stored files.
 */
export interface FileMetadata {
   /**
    * MIME content type (e.g., "image/png")
    */
   contentType?: string

   /**
    * Custom tags for the file
    */
   tags?: Record<string, string>

   /**
    * Cache control headers
    */
   cacheControl?: string

   /**
    * Content encoding
    */
   contentEncoding?: string
}
