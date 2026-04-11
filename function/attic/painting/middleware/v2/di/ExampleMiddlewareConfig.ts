import { MiddlewareConfig } from "./MiddlewareConfig.js"
import { MiddlewareDependencies } from "./MiddlewareModuleFactory.js"
import {
   NameByMiddleware,
   FilterByMiddleware,
   FileStoreMiddleware,
} from "../handlers/index.js"

/**
 * Example middleware configuration for a typical random art workflow
 *
 * Item Chain (runs on each child job):
 * 1. NameBy - Generate filename via expression
 * 2. FilterBy - Filter images by size
 * 3. FileStore (S3) - Save image to S3
 * 4. FileStore (Local) - Save image to local filesystem (staging)
 *
 * Collection Chain (runs on parent job):
 * - TBD: Buffer rehydration, collection validation, etc.
 */
export const exampleMiddlewareConfig: MiddlewareConfig = {
   itemChain: [
      // Step 1: Generate filename from expression
      {
         middlewareClass: NameByMiddleware,
         valueParams: {
            expression:
               "hash(buffer).slice(0,2) + '/' + hash(buffer).slice(2,14) + '.png'",
            outputProperty: "filename",
         },
      },

      // Step 2: Filter by content size
      {
         middlewareClass: FilterByMiddleware,
         valueParams: {
            expression: "buffer.length >= 1024 && buffer.length <= 10485760",
         },
      },

      // Step 3: Save to S3
      {
         middlewareClass: FileStoreMiddleware,
         valueParams: {
            pathProperty: "filename",
            uriProperty: "s3Uri",
            contentType: "image/png",
         },
         inject: [MiddlewareDependencies.S3FileStore],
      },

      // Step 4: Save to local filesystem (staging)
      {
         middlewareClass: FileStoreMiddleware,
         valueParams: {
            pathProperty: "filename",
            uriProperty: "localPath",
            contentType: "image/png",
         },
         inject: [MiddlewareDependencies.LocalFileStore],
      },
   ],

   // collectionChain: [
   // TODO: Add collection-level middleware
   // Examples:
   // - BufferRehydrationMiddleware (fetch from S3/local if needed)
   // - CollectionValidationMiddleware (check minimum success rate)
   // - CollectionAggregationMiddleware (combine results)
   // ],
}

/**
 * Alternative configuration: Simple hash-based naming
 */
export const contentHashConfig: MiddlewareConfig = {
   itemChain: [
      // Use hash-based naming expression
      {
         middlewareClass: NameByMiddleware,
         valueParams: {
            expression:
               "hash(buffer).slice(0,2) + '/' + hash(buffer).slice(2,14) + '.png'",
            outputProperty: "filename",
         },
      },

      {
         middlewareClass: FileStoreMiddleware,
         valueParams: {
            pathProperty: "filename",
            uriProperty: "s3Uri",
            contentType: "image/png",
         },
         inject: [MiddlewareDependencies.S3FileStore],
      },
   ],

   // collectionChain: [],
}

/**
 * Minimal configuration: Just save to S3 with hash-based names
 */
export const minimalConfig: MiddlewareConfig = {
   itemChain: [
      {
         middlewareClass: NameByMiddleware,
         valueParams: {
            expression:
               "hash(buffer).slice(0,2) + '/' + hash(buffer).slice(2,14) + '.png'",
            outputProperty: "filename",
         },
      },

      {
         middlewareClass: FileStoreMiddleware,
         valueParams: {
            pathProperty: "filename",
            uriProperty: "s3Uri",
            contentType: "image/png",
         },
         inject: [MiddlewareDependencies.S3FileStore],
      },
   ],

   // collectionChain: [],
}
