import { Type } from "@nestjs/common"
import * as z from "zod"

export interface IZodModuleClassBuilder<
   in out M extends string,
   out B extends IZodModuleClassBuilder<M> = IZodModuleClassBuilder<M, any>,
> {
   requireValue: <T>(
      name: string,
      token: string | symbol | Type<T>,
      schema?: z.ZodType | ((value: unknown) => boolean),
   ) => B

   requireObject: <T extends object>(
      name: string,
      token: string | symbol | Type<T>,
      validator?:
         | z.ZodObject
         | z.ZodArray
         | z.ZodCustom
         | ((item: unknown) => boolean),
   ) => B
}
