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
 * Legacy middleware that saves image buffer to local filesystem storage.
 *
 * Requires actualFilename to be set before execution.
 * Stores local path in customData.localPath for collection handler access.
 *
 * @deprecated Use FileStoreMiddleware with IFileStore instead
 */
export class LocalStorageHandlerMiddleware
   implements
      MiddlewareHandler<{ customData: { localPath: string } }, undefined>
{
   constructor(
      _params: Record<string, never>,
      private readonly logger: Logger,
      private readonly localStorage: IResultStore,
   ) {}

   async handle(
      ctx: ItemContext,
      _parser: Parser,
   ): Promise<
      MiddlewareResult<{ customData: { localPath: string } }, undefined>
   > {
      if (!ctx.actualFilename) {
         this.logger.error(
            "actualFilename must be set before LocalStorageHandler",
         )
         return {
            model: { customData: { localPath: "" } },
            disposition: JobDisposition.SEMANTIC_ERROR,
            error: new MissingRequiredFieldError(
               "actualFilename must be set before LocalStorageHandler",
            ),
         }
      }

      try {
         this.logger.debug(`Writing to local storage: ${ctx.actualFilename}`)

         const localPath = await this.localStorage.write(
            ctx.actualFilename,
            ctx.buffer,
            "image/png",
         )

         this.logger.log(`Successfully wrote to local storage: ${localPath}`)

         return {
            model: {
               customData: {
                  ...ctx.customData,
                  localPath,
               },
            },
            disposition: JobDisposition.OK,
         }
      } catch (error) {
         this.logger.error(
            `Failed to write to local storage: ${ctx.actualFilename}`,
            (error as Error).stack,
         )

         // Storage errors come pre-classified with isRetryable()
         // Use the error's built-in classification instead of inspecting messages
         const disposition =
            error instanceof StorageError && error.isRetryable()
               ? JobDisposition.TRANSIENT_ERROR
               : JobDisposition.FATAL_ERROR

         return {
            model: { customData: { localPath: "" } },
            disposition,
            error: error as Error,
         }
      }
   }
}
