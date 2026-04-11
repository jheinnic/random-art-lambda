import { Logger } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareResult } from "../types/MiddlewareResult.js"
import { Parser } from "../expression/Parser.js"
import { JobDisposition } from "../types/JobDisposition.js"
import { ByNameValue } from "../../messages/values/ByNameValue.js"

/**
 * Model-agnostic middleware that evaluates a nameBy expression to generate a filename.
 *
 * The expression can reference:
 * - task.* properties (domain model)
 * - project.* properties (project metadata)
 * - buffer, width, height (framework properties)
 * - Built-in functions: hash(), slice(), length(), get()
 * - Any parser extension functions accumulated by previous middleware
 *
 * The evaluated result is stored in a configurable output property.
 *
 * @template PropName - Type-safe output property name
 */
export class NameByMiddleware<PropName extends string>
   implements MiddlewareHandler<ByNameValue<PropName>, undefined>
{
   private readonly logger: Logger

   constructor(
      private readonly params: {
         /**
          * Expression to evaluate (e.g., "${task.campaign}/${hash(buffer).slice(0,12)}.png")
          */
         expression: string

         /**
          * Context property name to store the result
          * (e.g., "s3Path", "localPath")
          */
         outputProperty: PropName
      },
      logger?: Logger,
   ) {
      this.logger = logger ?? new Logger(NameByMiddleware.name)
   }

   async handle(
      ctx: any,
      parser: Parser,
   ): Promise<MiddlewareResult<ByNameValue<PropName>, undefined>> {
      this.logger.debug(
         `Evaluating nameBy expression: ${this.params.expression}`,
      )

      try {
         // Evaluate expression using accumulated parser
         const filename = await parser.evaluate<string>(
            this.params.expression,
            ctx,
         )
         this.logger.log(`Resolved filename: ${filename}`)
         // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
         const model: ByNameValue<PropName> = {
            [this.params.outputProperty]: filename,
         } as ByNameValue<PropName>

         return {
            model,
            disposition: JobDisposition.OK,
         }
      } catch (error) {
         this.logger.error(
            `Failed to evaluate nameBy expression: ${this.params.expression}`,
            (error as Error).stack,
         )

         return {
            disposition: JobDisposition.FATAL_ERROR,
            error: error as Error,
         }
      }
   }
}
