import type { Type } from "@nestjs/common"
import { MiddlewareResult } from "./MiddlewareResult.js"
import { Parser } from "../expression/Parser.js"

/**
 * Middleware handler interface - NEW REVISED VERSION
 *
 * Middleware can extend both the model and the parser.
 * The executor manages accumulated state.
 *
 * @template TAddedModel - Properties this middleware adds to the model
 * @template TAddedParser - Parser extension class (with static methods)
 */

export interface MiddlewareHandler<
   TAddedModel extends object = {},
   TAddedParser extends Type<any> | undefined = undefined,
> {
   /**
    * Process the context.
    *
    * @param ctx - Current task context with accumulated model
    * @param parser - Current parser with accumulated extensions
    * @returns Result with model additions, optional parser extension, and disposition
    */
   handle: (
      ctx: any, // TaskContext with accumulated model
      parser: Parser,
   ) => Promise<MiddlewareResult<TAddedModel, TAddedParser>>
}
