import { Logger } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareResult } from "../types/MiddlewareResult.js"
import { Parser } from "../expression/Parser.js"
import { JobDisposition } from "../types/JobDisposition.js"
import { ByNameValue } from "../../messages/values/ByNameValue.js"

/**
 * Model-agnostic middleware that evaluates a groupBy expression to generate a group identifier.
 *
 * Groups are used for aggregating multiple tasks together for finalization
 * at the origin node. The group ID is typically based on domain properties
 * like campaign, project, or other logical grouping criteria.
 *
 * The expression can reference:
 * - task.* properties (domain model)
 * - project.* properties (project metadata)
 * - Built-in functions: hash(), slice(), length(), get()
 * - Any parser extension functions accumulated by previous middleware
 *
 * The evaluated result is stored in a configurable output property.
 *
 * @template PropName - Type-safe output property name
 */
export class GroupByMiddleware<PropName extends string>
   implements MiddlewareHandler<ByNameValue<PropName>, undefined>
{
   private readonly logger: Logger

   constructor(
      private readonly params: {
         /**
          * Expression to evaluate (e.g., "${task.campaign}")
          */
         expression: string

         /**
          * Context property name to store the result
          * (typically "groupId")
          */
         outputProperty: PropName
      },
      logger?: Logger,
   ) {
      this.logger = logger ?? new Logger(GroupByMiddleware.name)
   }

   async handle(
      ctx: any,
      parser: Parser,
   ): Promise<MiddlewareResult<ByNameValue<PropName>, undefined>> {
      this.logger.debug(
         `Evaluating groupBy expression: ${this.params.expression}`,
      )

      try {
         // Evaluate expression using accumulated parser
         const groupId = await parser.evaluate<string>(
            this.params.expression,
            ctx,
         )

         this.logger.log(`Resolved group ID: ${groupId}`)

         return {
            model: {
               [this.params.outputProperty]: groupId,
            } as ByNameValue<PropName>,
            disposition: JobDisposition.OK,
         }
      } catch (error) {
         this.logger.error(
            `Failed to evaluate groupBy expression: ${this.params.expression}`,
            (error as Error).stack,
         )

         return {
            disposition: JobDisposition.FATAL_ERROR,
            error: error as Error,
         }
      }
   }
}
