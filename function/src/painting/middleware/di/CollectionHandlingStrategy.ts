/**
 * Strategy for handling child jobs with non-OK dispositions in collection mode
 */
export enum CollectionHandlingStrategy {
   /**
    * Filter out failed/ignored jobs from results array
    * Results array will be shorter than original job count
    */
   OMIT = "OMIT",

   /**
    * Replace failed/ignored jobs with null in results array
    * Results array maintains original length with nulls
    */
   NULL = "NULL",

   /**
    * Include ErrorMarker records for failed/ignored jobs
    * Results array maintains original length with markers
    */
   MARK = "MARK",

   /**
    * Fail entire collection without invoking handler (pre-invocation failure)
    * Handler never gets called if ANY job has this disposition
    */
   FAIL = "FAIL",
}

/**
 * Configuration for collection-level job handling
 */
export interface CollectionConfig {
   /**
    * How to handle jobs with IGNORE disposition
    */
   ignoreHandling: CollectionHandlingStrategy

   /**
    * How to handle jobs with hard error dispositions
    * (FATAL_ERROR, SEMANTIC_ERROR, OUT_OF_RETRIES)
    */
   errorHandling: CollectionHandlingStrategy
}
