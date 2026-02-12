import { Logger } from "@nestjs/common"
import {
   MiddlewareHandler,
   MiddlewareResult,
   Parser,
} from "../config/MiddlewareConfigTypes.js"
import { ItemContext } from "../types/ItemContext.js"
import { JobDisposition } from "../types/JobDisposition.js"
import { MissingRequiredFieldError } from "../errors/MissingRequiredFieldError.js"
import { IResultStore } from "../../../storage/interface/IResultStore.js"
import { StorageError } from "../../../storage/errors/StorageError.js"

/**
 * Legacy middleware that saves image buffer to S3 storage.
 *
 * Requires actualFilename to be set before execution.
 * Stores S3 URI in customData.s3Uri for collection handler access.
 *
 * @deprecated Use FileStoreMiddleware with IFileStore instead
 */
export class S3StorageHandlerMiddleware
   implements MiddlewareHandler<{ customData: { s3Uri: string } }, undefined>
{
   constructor(
      _params: Record<string, never>,
      private readonly logger: Logger,
      private readonly s3Store: IResultStore,
   ) {}

   async handle(
      ctx: ItemContext,
      _parser: Parser,
   ): Promise<MiddlewareResult<{ customData: { s3Uri: string } }, undefined>> {
      if (ctx.actualFilename == null) {
         this.logger.error("actualFilename must be set before S3StorageHandler")
         return {
            model: { customData: { s3Uri: "" } },
            disposition: JobDisposition.SEMANTIC_ERROR,
            error: new MissingRequiredFieldError(
               "actualFilename must be set before S3StorageHandler",
            ),
         }
      }

      try {
         this.logger.debug(`Writing to S3: ${ctx.actualFilename}`)

         const s3Uri = await this.s3Store.write(
            ctx.actualFilename,
            ctx.buffer,
            "image/png",
         )

         this.logger.log(`Successfully wrote to S3: ${s3Uri}`)

         return {
            model: {
               customData: {
                  ...ctx.customData,
                  s3Uri,
               },
            },
            disposition: JobDisposition.OK,
         }
      } catch (error) {
         this.logger.error(
            `Failed to write to S3: ${ctx.actualFilename}`,
            (error as Error).stack,
         )

         // Storage errors come pre-classified with isRetryable()
         // Use the error's built-in classification instead of inspecting messages
         const disposition =
            error instanceof StorageError && error.isRetryable()
               ? JobDisposition.TRANSIENT_ERROR
               : JobDisposition.FATAL_ERROR

         return {
            model: { customData: { s3Uri: "" } },
            disposition,
            error: error as Error,
         }
      }
   }
}
