import type { Type } from "@nestjs/common"
import type { JobDisposition, MiddlewareThrowable } from "./JobDisposition.js"

/**
 * Result from middleware execution.
 *
 * @template TAddedModel - Properties this middleware adds to the model
 * @template TAddedParser - Parser extension class (with static methods)
 */

export type MiddlewareResult<
   TAddedModel extends object,
   TAddedParser extends Type<any> | undefined = undefined,
> =
   | IsValidMiddlewareResult<TAddedModel, TAddedParser>
   | IsIgnoredMiddlewareResult
   | IsFailedMiddlewareResult

export interface IsValidMiddlewareResult<
   TAddedModel extends object,
   TAddedParser extends Type<any> | undefined, // IsModelExtension<TAddedParser, TAddedModel> | undefined,
> {
   /**
    * Job disposition
    */
   disposition: JobDisposition.OK

   /**
    * Properties to add to the accumulated model
    */
   model?: TAddedModel

   /**
    * Optional parser extension to add to accumulated parser
    */
   parserExtension?: TAddedParser
}

export interface IsIgnoredMiddlewareResult {
   disposition: JobDisposition.IGNORE
}

export interface IsFailedMiddlewareResult {
   /**
    * Job disposition
    */
   disposition: MiddlewareThrowable

   /**
    * Error (if disposition is not OK)
    */
   error: Error
}
