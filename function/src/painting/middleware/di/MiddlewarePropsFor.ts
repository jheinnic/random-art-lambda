import type { Type } from "@nestjs/common"
import { MiddlewareHandler } from "../types/MiddlewareHandler.js"
import { MiddlewareProps } from "./MiddlewareProps.js"

export type MiddlewarePropsFor<M extends Array<MiddlewareHandler<any, any>>> = {
   [I in keyof M]: MiddlewareProps<Type<M[I]>>
}
