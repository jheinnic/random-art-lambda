/**
 * Import tokens for middleware module dependencies
 */
export interface MiddlewareDependencyTokens {
   /**
    * S3 file store implementation
    */
   S3FileStore: symbol | string

   /**
    * Local file store implementation
    */
   LocalFileStore: symbol | string

   /**
    * Expression context add-ons for custom functions
    */
   ExpressionAddons: symbol | string

   /**
    * LRU cache for buffer rehydration
    */
   BufferCache?: symbol | string
}
