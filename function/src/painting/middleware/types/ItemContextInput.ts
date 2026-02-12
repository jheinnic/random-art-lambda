import {
   CIDString,
   PrefixString,
   SuffixString,
} from "../../../messages/interface/index.js"

/**
 * Readonly input data for item-level middleware processing.
 *
 * This represents the immutable job inputs that middleware can read but not modify.
 * Handlers receive this along with mutable state, and return updated mutable state.
 */
export interface ItemContextInput {
   /**
    * Unique identifier for this job
    */
   readonly jobId: string

   /**
    * Rendered pixel data (before PNG encoding)
    */
   readonly pixels: ImageData

   /**
    * Image dimensions and seed metadata
    */
   readonly metadata: {
      readonly width: number
      readonly height: number
      readonly seedPrefix: PrefixString // base64-encoded 16-byte binary seed
      readonly seedSuffix: SuffixString // base64-encoded 16-byte binary seed
      readonly regionMapCID: CIDString

      /**
       * Optional name-to-CID mapping for regionMapName() expression function
       * Maps human-readable names to regionMapCID values
       */
      readonly regionMapName: string
   }

   /**
    * Optional filename expression to evaluate.
    * If present, FileNameResolverMiddleware will evaluate it to set actualFilename.
    */
   readonly filenameExpression?: string

   /**
    * Execution strategy for this job
    */
   readonly executionStrategy: "WorkerPool" | "OriginNode"

   /**
    * Collection context (only present if part of a collection)
    */
   readonly collection?: {
      /**
       * Zero-based index of this item within the collection
       */
      readonly imageIndex: number

      /**
       * Total number of images in the collection
       */
      readonly totalImages: number
   }
}
