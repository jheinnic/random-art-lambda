import { createHash } from "node:crypto"

/**
 * Compute a hex digest from one or more input values.
 *
 * Designed for use as a pipeline pure function via addPureFunction("hash", hash).
 * Each input is coerced to string via String() before hashing so that numbers and
 * other primitives work naturally in expression context.
 *
 * @param algorithm - Any algorithm accepted by node:crypto createHash (e.g. "sha256", "md5")
 * @param inputs    - One or more values to hash in sequence
 */
export function hash(algorithm: string, ...inputs: unknown[]): string {
   const h = createHash(algorithm)
   for (const input of inputs) {
      h.update(String(input))
   }
   return h.digest("hex")
}
