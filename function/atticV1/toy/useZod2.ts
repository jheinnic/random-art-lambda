import { z } from "zod"

const inputSchema = z.array(z.number())

// 1. Explicitly define the two output schemas.
const colorObjectSchema = z.object({
   color: z.enum(["blue", "red"]),
   parity: z.literal("even"),
})

const symbolObjectSchema = z.object({
   symbol: z.enum(["star", "circle"]),
   isOdd: z.boolean(),
})

// 2. Combine them into a union.
const outputUnionSchema = z.union([colorObjectSchema, symbolObjectSchema])
const arrOutput = z.array(outputUnionSchema)

// 3. Chain transformation and validation using `.pipe()`.
const transformedAndValidatedSchema = inputSchema
   .transform((numbers) => {
      return numbers.map((n) => {
         if (n % 2 === 0) {
            return {
               color: n > 5 ? "blue" : "rod", // Deliberately introduce an error
               parity: "even" as const,
            }
         } else {
            return {
               symbol: n > 5 ? "stir" : "corcle", // Deliberately introduce an error
               isOdd: true,
            }
         }
      })
   })
   .pipe(arrOutput) // Pipe the transformed data into a new validation step.

// 4. `z.infer` works the same way.
type TransformedOutput = z.infer<typeof transformedAndValidatedSchema>

console.log(transformedAndValidatedSchema.safeParse([1, 2, 3, 4, 5, 6]))
