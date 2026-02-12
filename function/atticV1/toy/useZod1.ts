import { animationFrameScheduler } from "rxjs"
import { z } from "zod"
import { tr } from "zod/v4/locales"

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

// 3. Define the transformation, ensuring the returned objects match the union.
const transformedSchema = inputSchema.transform((numbers) => {
   return numbers.map((n) => {
      if (n % 2 === 0) {
         // The returned object now directly matches `colorObjectSchema`.
         return {
            color: n > 5 ? "blue" : "rod",
            parity: "even" as const,
         }
      } else {
         // The returned object now directly matches `symbolObjectSchema`.
         return {
            symbol: n > 5 ? "stir" : "corcle",
            isOdd: true,
         }
      }
   }) as z.infer<typeof arrOutput> // Optional assertion for clarity
})

// 4. z.infer now correctly produces the desired union type.
type TransformedOutput = z.infer<typeof transformedSchema>
console.log(transformedSchema.def.out.def)
console.log(transformedSchema.safeParse([1, 2, 3, 4, 5, 6]))

/*
  The inferred type `TransformedOutput` will be:
  (
    {
      color: "blue" | "red";
      parity: "even";
    } | {
      symbol: "star" | "circle";
      isOdd: boolean;
    }
  )[]
*/
