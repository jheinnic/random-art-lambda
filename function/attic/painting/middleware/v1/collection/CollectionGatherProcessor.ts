import { Logger } from "@nestjs/common"
import { ItemContext } from "../types/ItemContext.js"
import {
   CollectionConfig,
   CollectionHandlingStrategy,
} from "../di/CollectionHandlingStrategy.js"
// import { CollectionResult, ErrorMarker } from "../types/CollectionResult.js"
import { JobDisposition, isHardError } from "../types/JobDisposition.js"
import { CollectionPreInvocationFailureError } from "../errors/CollectionPreInvocationFailureError.js"
import { CollectionResult, ErrorMarker } from "../../messages/values/index.js"

/**
 * Processes collection of child jobs and invokes collection handler.
 *
 * Handles disposition-based filtering and error handling before
 * invoking the application's collection handler.
 */
export class CollectionGatherProcessor<T> {
   private readonly logger: Logger

   constructor(
      private readonly config: CollectionConfig,
      private readonly collectionHandler: (
         result: CollectionResult<T>,
      ) => Promise<any>,
      loggerContext: string = "CollectionGatherProcessor",
   ) {
      this.logger = new Logger(loggerContext)
      this.validateConfig()
   }

   /**
    * Validate configuration and log warnings for potential index mismatches
    */
   private validateConfig(): void {
      const { ignoreHandling, errorHandling } = this.config

      // Warn if one uses OMIT and the other uses NULL or MARK (index mismatch)
      const ignoreOmits = ignoreHandling === CollectionHandlingStrategy.OMIT
      const errorOmits = errorHandling === CollectionHandlingStrategy.OMIT
      const ignorePreservesIndex =
         ignoreHandling === CollectionHandlingStrategy.NULL ||
         ignoreHandling === CollectionHandlingStrategy.MARK
      const errorPreservesIndex =
         errorHandling === CollectionHandlingStrategy.NULL ||
         errorHandling === CollectionHandlingStrategy.MARK

      if (
         (ignoreOmits && errorPreservesIndex) ||
         (errorOmits && ignorePreservesIndex)
      ) {
         this.logger.warn(
            "Collection indices will not match job declaration sequence when " +
               "ignoreHandling and errorHandling use different strategies (OMIT vs NULL/MARK).",
         )
      }
   }

   /**
    * Process collection of child jobs and invoke handler.
    *
    * @param childrenValues Map from job ID to middleware context (from job.getChildrenValues())
    * @returns Result from collection handler
    * @throws CollectionPreInvocationFailureError if FAIL strategy triggered
    */
   async processCollection(
      childrenValues: Record<string, ItemContext>,
   ): Promise<any> {
      const results: Array<T | null | ErrorMarker> = []
      let ignoreCounter = 0
      let errorCounter = 0

      // Process all child job results
      const jobEntries = Object.entries(childrenValues)
      for (let i = 0; i < jobEntries.length; i++) {
         const [jobId, ctx] = jobEntries[i]

         this.logger.debug(
            `Child job ${i} (${jobId}) completed with disposition: ${ctx.disposition}`,
         )

         // Handle IGNORE disposition
         if (ctx.disposition === JobDisposition.IGNORE) {
            ignoreCounter++
            this.logger.log(
               `Child job ${i} (${jobId}) ignored: ${ctx.error?.message ?? "no error message"}`,
            )

            // PRE-INVOCATION FAILURE: Fail immediately without calling handler
            if (
               this.config.ignoreHandling === CollectionHandlingStrategy.FAIL
            ) {
               this.logger.error(
                  `Collection failed due to IGNORE in child ${i} (FAIL handling prevents handler invocation)`,
               )
               throw new CollectionPreInvocationFailureError(
                  `Collection aborted: child job ${i} (${jobId}) was ignored`,
                  {
                     disposition: ctx.disposition,
                     childIndex: i,
                     jobId,
                     error: ctx.error,
                  },
               )
            }

            this.processDisposition(
               results,
               i,
               jobId,
               ctx,
               this.config.ignoreHandling,
            )
            continue
         }

         // Handle hard error dispositions
         if (isHardError(ctx.disposition)) {
            errorCounter++
            this.logger.error(
               `Child job ${i} (${jobId}) failed with ${ctx.disposition}: ${ctx.error?.message ?? "no error message"}`,
               ctx.error?.stack,
            )

            // PRE-INVOCATION FAILURE: Fail immediately without calling handler
            if (this.config.errorHandling === CollectionHandlingStrategy.FAIL) {
               this.logger.error(
                  `Collection failed due to ${ctx.disposition} in child ${i} (FAIL handling prevents handler invocation)`,
               )
               throw new CollectionPreInvocationFailureError(
                  `Collection aborted: child job ${i} (${jobId}) failed with ${ctx.disposition}`,
                  {
                     disposition: ctx.disposition,
                     childIndex: i,
                     jobId,
                     error: ctx.error,
                  },
               )
            }

            this.processDisposition(
               results,
               i,
               jobId,
               ctx,
               this.config.errorHandling,
            )
            continue
         }

         // OK disposition - extract result
         this.logger.debug(`Child job ${i} (${jobId}) succeeded`)
         results.push(ctx.customData as T)
      }

      // Build collection result
      const collectionResult: CollectionResult<T> = {
         results,
         ignoreCounter,
         errorCounter,
      }

      this.logger.log(
         `Invoking collection handler with ${results.length} results ` +
            `(${ignoreCounter} ignored, ${errorCounter} errors)`,
      )

      // INVOKE HANDLER - it may throw (post-invocation failure)
      try {
         const handlerResult = await this.collectionHandler(collectionResult)
         this.logger.log("Collection handler completed successfully")
         return handlerResult
      } catch (error) {
         // POST-INVOCATION FAILURE: Handler examined results and chose to fail
         this.logger.error(
            "Collection handler threw error after examining results",
            {
               error: (error as Error).message,
               ignoreCounter,
               errorCounter,
               stack: (error as Error).stack,
            },
         )
         throw error // Propagate handler's error
      }
   }

   /**
    * Process a single disposition based on handling strategy
    */
   private processDisposition(
      results: Array<T | null | ErrorMarker>,
      index: number,
      jobId: string,
      ctx: ItemContext,
      strategy: CollectionHandlingStrategy,
   ): void {
      switch (strategy) {
         case CollectionHandlingStrategy.OMIT:
            // Don't add anything to results
            break

         case CollectionHandlingStrategy.NULL:
            results.push(null)
            break

         case CollectionHandlingStrategy.MARK:
            results.push({
               disposition: ctx.disposition as any, // Already validated as non-OK
               originalIndex: index,
               error: ctx.error,
               jobId,
            })
            break

         case CollectionHandlingStrategy.FAIL:
            // Will be handled by caller
            break
      }
   }
}
