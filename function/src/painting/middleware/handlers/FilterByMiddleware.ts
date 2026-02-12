import { Logger } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareResult } from "../types/MiddlewareResult.js"
import { Parser } from "../expression/Parser.js"
import { JobDisposition } from "../types/JobDisposition.js"

/**
 * Model-agnostic middleware that evaluates a filterBy expression to determine if processing should continue.
 *
 * The expression should evaluate to a boolean. If false, the job is marked as
 * IGNORE (filtered out). If true, processing continues.
 *
 * Common use cases:
 * - Size filtering: "buffer.length < 5000000"
 * - Content filtering: "isHighEntropy()"
 * - Domain filtering: "task.category === 'valid'"
 *
 * The expression can reference:
 * - task.* properties (domain model)
 * - project.* properties (project metadata)
 * - buffer, width, height (framework properties)
 * - Built-in functions: hash(), slice(), length(), get()
 * - Any parser extension functions accumulated by previous middleware
 */
export class FilterByMiddleware implements MiddlewareHandler<{}, undefined> {
   private readonly logger: Logger

   constructor(
      private readonly params: {
         /**
          * Expression to evaluate (e.g., "buffer.length < 5000000")
          */
         expression: string
      },
      logger?: Logger,
   ) {
      this.logger = logger ?? new Logger(FilterByMiddleware.name)
   }

   async handle(
      ctx: any,
      parser: Parser,
   ): Promise<MiddlewareResult<{}, undefined>> {
      this.logger.debug(
         `Evaluating filterBy expression: ${this.params.expression}`,
      )

      try {
         // Evaluate expression using accumulated parser
         const passesFilter = await parser.evaluate<boolean>(
            this.params.expression,
            ctx,
         )

         this.logger.log(`Filter result: ${String(passesFilter)}`)

         if (!passesFilter) {
            this.logger.warn(
               `Job filtered out by expression: ${this.params.expression}`,
            )
            return {
               disposition: JobDisposition.IGNORE,
            }
         }

         return {
            model: {},
            disposition: JobDisposition.OK,
         }
      } catch (error) {
         this.logger.error(
            `Failed to evaluate filterBy expression: ${this.params.expression}`,
            (error as Error).stack,
         )

         return {
            disposition: JobDisposition.FATAL_ERROR,
            error: error as Error,
         }
      }
   }
}
