import { Type } from "@nestjs/common"
import * as z from "zod"
import { zInjectionToken, zModule, zProvider } from "../components/ZodNest.js"
import { IZodModuleClassBlueprint } from "./IZodModuleClassBlueprint.js"

export const valueProperty = z.union([
   z.any().pipe(
      z.transform((value) => {
         return { from: "literal", value }
      }),
   ),
   z.discriminatedUnion("use", [
      z.discriminatedUnion("for", [
         z.object({
            use: z.literal("token"),
            for: z.literal("value"),
            token: zInjectionToken,
            module: zModule.optional(),
         }),
         z.object({
            use: z.literal("token"),
            for: z.literal("factory"),
            token: zInjectionToken,
            module: zModule.optional(),
            method: z.string().default("create"),
         }),
      ]),
      z.discriminatedUnion("for", [
         z.object({
            use: z.literal("provider"),
            for: z.literal("value"),
            module: zModule.optional(),
            provider: zProvider,
         }),
         z.object({
            use: z.literal("provider"),
            for: z.literal("factory"),
            module: zModule.optional(),
            provider: zProvider,
            method: z.string().default("create"),
         }),
      ]),
      z.object({ use: z.literal("value"), value: z.any() }),
      z.object({
         use: z.literal("function"),
         value: z.function({
            input: z.any().array(),
            output: z.any(),
         }),
         inject: z
            .array(
               z.union([
                  zInjectionToken,
                  z.object({
                     token: zInjectionToken,
                     module: zModule.optional(),
                     optional: z.boolean().default(false),
                  }),
                  z.object({
                     provider: zProvider,
                     module: zModule.optional(),
                     optional: z.boolean().default(false),
                  }),
               ]),
            )
            .optional(),
      }),
   ]),
])

export const objectProperty = z.union([
   zInjectionToken.transform((token: any) => {
      return { from: "token", for: "value", token }
   }),
   z.discriminatedUnion("use", [
      z.discriminatedUnion("for", [
         z.object({
            use: z.literal("token"),
            for: z.literal("value"),
            token: zInjectionToken,
            module: zModule.optional(),
         }),
         z.object({
            use: z.literal("token"),
            for: z.literal("factory"),
            token: zInjectionToken,
            module: zModule.optional(),
            method: z.string().default("create"),
         }),
      ]),
      z.discriminatedUnion("for", [
         z.object({
            use: z.literal("provider"),
            for: z.literal("value"),
            module: zModule.optional(),
            provider: zProvider,
         }),
         z.object({
            use: z.literal("provider"),
            for: z.literal("factory"),
            module: zModule.optional(),
            provider: zProvider,
            method: z.string().default("create"),
         }),
      ]),
      z.object({ use: z.literal("value"), value: z.any() }),
      z.object({
         use: z.literal("function"),
         value: z.function({
            input: z.any().array(),
            output: z.any(),
         }),
         inject: z
            .array(
               z.union([
                  zInjectionToken,
                  z.object({
                     token: zInjectionToken,
                     module: zModule.optional(),
                     optional: z.boolean().default(false),
                  }),
                  z.object({
                     provider: zProvider,
                     module: zModule.optional(),
                     optional: z.boolean().default(false),
                  }),
               ]),
            )
            .optional(),
      }),
   ]),
])

type ValueProperty = z.infer<typeof valueProperty>
type ObjectProperty = z.infer<typeof objectProperty>

type NextB<
   E extends {},
   M extends string,
   B extends IZodModuleClassBuilder<E, any, M, any>,
   K extends {},
> =
   B extends IZodModuleClassBuilder<E, any, M, infer I>
      ? IZodModuleClassBuilder<E, K, string, NextB<E, M, I, K>>
      : never

export interface IZodModuleClassBuilder<
   in out External extends {},
   in out Imports extends {},
   in out M extends string,
   out B extends IZodModuleClassBuilder<
      External,
      Imports,
      M,
      any
   > = IZodModuleClassBuilder<External, Imports, M, any>,
> {
   requireValue: <T>(
      name: string,
      token: string | symbol | Type<T>,
      schema?: z.ZodType | ((value: unknown) => boolean),
   ) => NextB<External, M, B, Imports & { [name]: ValueProperty }>

   requireObject: <T extends object>(
      name: string,
      token: string | symbol | Type<T>,
      validator?:
         | z.ZodObject
         | z.ZodArray
         | z.ZodCustom
         | ((item: unknown) => boolean),
   ) => NextB<External, M, B, Imports & { [name]: ObjectProperty }>
}
