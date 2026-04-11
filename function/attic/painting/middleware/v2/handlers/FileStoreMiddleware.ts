import { Logger } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareResult } from "../types/MiddlewareResult.js"
import { Parser } from "../expression/Parser.js"
import { JobDisposition } from "../types/JobDisposition.js"
import { MissingRequiredFieldError } from "../errors/MissingRequiredFieldError.js"
import { IFileStore } from "../../../storage/interface/IFileStore.js"
import { StorageError } from "../../../storage/errors/StorageError.js"
import { ByNameValue } from "../../messages/values/ByNameValue.js"

/**
 * Generic file storage middleware that works with any IFileStore implementation.
 *
 * Reads the filename from a configurable context property (e.g., "s3Path", "localPath")
 * and writes the buffer to storage using the injected IFileStore.
 *
 * The resolved URI is stored in a configurable output property (e.g., "s3Uri", "localUri").
 *
 * @template UriPropName - Type-safe output property name for the URI
 */
export class FileStoreMiddleware<UriPropName extends string>
   implements MiddlewareHandler<ByNameValue<UriPropName>, undefined>
{
   private readonly logger: Logger

   constructor(
      private readonly params: {
         /**
          * Context property name containing the resolved filename
          * (e.g., "s3Path", "localPath")
          */
         pathProperty: string

         /**
          * Context property name to store the resulting URI
          * (e.g., "s3Uri", "localUri")
          */
         uriProperty: UriPropName

         /**
          * Content type for the file (e.g., "image/png")
          */
         contentType?: string
      },
      private readonly fileStore: IFileStore,
      logger?: Logger,
   ) {
      this.logger = logger ?? new Logger(FileStoreMiddleware.name)
   }

   async handle(
      ctx: any,
      _parser: Parser,
   ): Promise<MiddlewareResult<ByNameValue<UriPropName>, undefined>> {
      // Read filename from configured property
      const filename = ctx[this.params.pathProperty] as string | undefined

      if (filename === undefined) {
         this.logger.error(
            `${this.params.pathProperty} must be set before FileStoreMiddleware`,
         )
         return {
            disposition: JobDisposition.SEMANTIC_ERROR,
            error: new MissingRequiredFieldError(
               `${this.params.pathProperty} must be set before FileStoreMiddleware`,
            ),
         }
      }

      try {
         this.logger.debug(
            `Writing to ${String(this.fileStore.constructor.name)}: ${filename}`,
         )

         const uri = await this.fileStore.write(filename, ctx.buffer, {
            contentType: this.params.contentType,
         })

         this.logger.log(
            `Successfully wrote to ${String(this.fileStore.constructor.name)}: ${uri}`,
         )

         return {
            model: {
               [this.params.uriProperty]: uri,
            } as ByNameValue<UriPropName>,
            disposition: JobDisposition.OK,
         }
      } catch (error) {
         this.logger.error(
            `Failed to write to ${String(this.fileStore.constructor.name)}: ${filename}`,
            (error as Error).stack,
         )

         // Storage errors come pre-classified with isRetryable()
         // Use the error's built-in classification instead of inspecting messages
         const disposition =
            error instanceof StorageError && error.isRetryable()
               ? JobDisposition.TRANSIENT_ERROR
               : JobDisposition.FATAL_ERROR

         return {
            disposition,
            error: error as Error,
         }
      }
   }
}
