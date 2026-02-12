import { AsyncLocalStorage } from "async_hooks"
import { isValid, monotonicFactory } from "ulid"
import { ULIDString } from "../../messages/interface/index.js"
import { getMyPrimeField, RandomPrimeField } from "./RandomPrimeField.js"

const ULID_BASE32_PRNG_FLOATS = Array(32)
   .fill(0)
   .map((x, i) => i / 32)
const ULID_PRNG_VALUE_BITS: number = 5

export function seedULIDPrng(primeField: RandomPrimeField): () => number {
   const generator: Generator<bigint> =
      primeField.rollSequence(ULID_PRNG_VALUE_BITS)
   return (): number => {
      const nextItem: IteratorResult<bigint> = generator.next()
      return ULID_BASE32_PRNG_FLOATS[nextItem.value]
   }
}

function seedULIDFactory(): () => ULIDString {
   const primeField: RandomPrimeField = getMyPrimeField()
   const prng: () => number = seedULIDPrng(primeField)
   return monotonicFactory(prng) as () => ULIDString
}

const asyncUlidStorage = new AsyncLocalStorage<() => ULIDString>()

export function getMyULIDFactory(): () => ULIDString {
   return asyncUlidStorage.run(seedULIDFactory(), (): (() => ULIDString) => {
      const ulid: (() => ULIDString) | undefined = asyncUlidStorage.getStore()
      if (ulid != null) {
         return ulid
      }
      console.error("No ULID Factory found??")
      // throw new Error("No ULID Factory found??")
      return seedULIDFactory()
   })
}

export function generateULID(): ULIDString {
   return getMyULIDFactory()()
}

/**
 * Validates that a string is a well-formed ULID.
 *
 * @param ulidString - The string to validate
 * @returns True if the string is a valid ULID format
 */
export function blessUlidString(ulidString: string): ulidString is ULIDString {
   return isValid(ulidString)
}
