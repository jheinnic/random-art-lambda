import {
   DynamicModule,
   ForwardReference,
   Scope,
   Type,
   OptionalFactoryDependency,
} from "@nestjs/common"
import { ConstructorFunction } from "simplytyped"
import * as z from "zod"

// 1. A custom Zod schema for a class constructor (Newable).
// This checks if the value is a function with a prototype, which identifies a class.
export const zFunction = z.custom<Function>(
   (val: unknown): boolean => typeof val === "function",
   {
      message: "Value must be a function",
   },
)
export const zType = z.custom<ConstructorFunction<any>>(
   (val: unknown): boolean =>
      typeof val === "function" &&
      val.prototype !== undefined &&
      val.prototype.constructor === val,
   {
      message: "Value must be a class constructor.",
   },
)

export const zAbstract = z.custom<ConstructorFunction<any>>(
   (val: unknown): boolean =>
      typeof val === "function" &&
      val.prototype !== undefined &&
      val.prototype.constructor !== val,
   {
      message: "Value must be a class constructor.",
   },
)

/*  */
// Define the Zod schema for an InjectionToken
export const zInjectionToken = z.union([
   z.string(), // A string token (e.g., 'DATABASE_CONNECTION')
   z.symbol(), // A symbol token (e.g., Symbol('CACHE_MANAGER'))
   zType, // A class reference (e.g., UserService)
   zAbstract, // A base class reference
   zFunction,
])

export const zOptionalFactoryDependency = z.object({
   token: zInjectionToken,
   optional: z.boolean(),
})

export const zScope = z.enum(Scope)

// Define schemas for each type of provider
export const zClassProvider = z.object({
   provide: zInjectionToken,
   useClass: zType,
   scope: zScope.optional(),
   durable: z.boolean().optional(),
})

export const zValueProvider = z.object({
   provide: zInjectionToken,
   useValue: z.any(),
})

export const zFactoryProvider = z.object({
   provide: zInjectionToken,
   useFactory: z.function(),
   inject: z
      .array(z.union([zInjectionToken, zOptionalFactoryDependency]))
      .optional(),
   scope: zScope.optional(),
   durable: z.boolean().optional(),
})

export const zExistingProvider = z.object({
   provide: zInjectionToken,
   useExisting: zInjectionToken,
})

// A provider can be a class, or any of the provider object types.
export const zProvider = z.union([
   zType,
   zClassProvider,
   zValueProvider,
   zFactoryProvider,
   zExistingProvider,
])

export const zForwardReference = z.object({
   forwardRef: z.any(),
})

// A schema for a NestJS module. We define it as a "lazy" schema to handle circular references.
// The type is a ZodObject, but we use z.lazy() to allow for recursive calls.
export const zModuleMetadata = z.object({
   imports: z
      .array(
         z.lazy(
            (): z.ZodType<
               | Type<any>
               | DynamicModule
               | Promise<DynamicModule>
               | ForwardReference
            > =>
               z.union([
                  zType,
                  zDynamicModule,
                  z.promise(zDynamicModule),
                  zForwardReference,
               ]),
         ),
      )
      .optional(),
   providers: z.array(zProvider).optional(),
   controllers: z.array(zType).optional(),
   exports: z
      .array(
         z.union([
            zType,
            z.lazy((): z.ZodType<DynamicModule> => zDynamicModule),
            zProvider,
            zInjectionToken,
            zForwardReference,
         ]),
      )
      .optional(),
})

export const zDynamicModule = zModuleMetadata.extend({
   module: zType,
   global: z.boolean().optional(),
})

// A NestJS module is a class (Newable) OR a DynamicModule.
export const zModule = z.union([zType, zDynamicModule])

type Foo = z.infer<typeof zDynamicModule>
let a: DynamicModule = {} as unknown as DynamicModule
let b: Foo = {} as unknown as Foo

a = b
b = a
if (b.imports === undefined) {
   console.log("b")
}
if (a.imports === undefined) {
   console.log("a")
}
