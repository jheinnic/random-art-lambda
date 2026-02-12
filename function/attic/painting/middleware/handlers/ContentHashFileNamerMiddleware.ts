import { Logger } from "@nestjs/common"
import * as crypto from "crypto"
import {
   MiddlewareHandler,
   MiddlewareResult,
   Parser,
} from "../config/MiddlewareConfigTypes.js"
import { ItemContext } from "../types/ItemContext.js"
import { JobDisposition } from "../types/JobDisposition.js"

/**
 * Legacy middleware that generates filenames based on content hash.
 *
 * If actualFilename is already set, this middleware is a no-op.
 * Otherwise, generates a filename from SHA-256 hash of the buffer.
 *
 * @deprecated Use NameByMiddleware with hash() expression instead:
 *   `"${hash(buffer).slice(0,2)}/${hash(buffer).slice(2,14)}.png"`
 */
export class ContentHashFileNamerMiddleware
   implements MiddlewareHandler<{ actualFilename?: string }, undefined>
{
   constructor(
      private readonly params: {
         dirSegmentLength?: number
         fileSegmentLength?: number
         extension?: string
      },
      private readonly logger: Logger,
   ) {}

   async handle(
      ctx: ItemContext,
      _parser: Parser,
   ): Promise<MiddlewareResult<{ actualFilename?: string }, undefined>> {
      const dirSegmentLength = this.params.dirSegmentLength ?? 2
      const fileSegmentLength = this.params.fileSegmentLength ?? 12
      const extension = this.params.extension ?? "png"
      if (ctx.actualFilename !== undefined) {
         this.logger.debug("Filename already set, skipping hash-based naming")
         return {
            model: {},
            disposition: JobDisposition.OK,
         }
      }

      const hash = crypto
         .createHash("sha256")
         .update(ctx.buffer)
         .digest("base64")
         .replace(/[/+=]/g, "_")

      const dirPart = hash.slice(0, dirSegmentLength)
      const filePart = hash.slice(
         dirSegmentLength,
         dirSegmentLength + fileSegmentLength,
      )

      const filename = `${dirPart}/${filePart}.${extension}`

      this.logger.debug(`Generated hash-based filename: ${filename}`)

      return {
         model: { actualFilename: filename },
         disposition: JobDisposition.OK,
      }
   }
}
