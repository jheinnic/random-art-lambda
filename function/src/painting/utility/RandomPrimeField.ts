import { modPow } from "bigint-mod-arith"
import { AsyncLocalStorage } from "node:async_hooks"
import { checkPrimeSync } from "node:crypto"

const BIG_MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)
const BIAS_PADDING: number = 64
const BASE_PRIME_FIELD_BITS = 38

export class RandomPrimeField {
   public readonly p: bigint
   public readonly factorsOfPMinusOne: Set<bigint>
   // public readonly generator: bigint

   constructor(private readonly bitLength: number = 32) {
      this.p = this.generateLargePrime()
      this.factorsOfPMinusOne = this.factorizePMinusOne()
      // this.generator = this.findPrimitiveRoot()
   }

   public *rollSequence(nBits: number): Generator<bigint> {
      const g = this.findPrimitiveRoot()
      const e: number = Math.ceil((nBits + BIAS_PADDING) / this.bitLength)
      const pToE = this.p ** BigInt(e)
      console.log(this.p, g, e, pToE)
      let last = g
      while (true) {
         last = (last * g) % pToE
         yield BigInt.asUintN(nBits, last)
      }
   }

   private isMillerRabinPassed(n: bigint, k: number = 40): boolean {
      if (n < 2n) {
         return false
      } else if (n === 2n || n === 3n) {
         return true
      } else if (n % 2n === 0n) {
         return false
      }

      let r = 0
      let d: bigint = n - 1n
      while (d % 2n === 0n) {
         r += 1
         d = d / 2n
      }

      let a, x
      let ii = 0
      for (ii = 0; ii < k; ii++) {
         // a = Math.floor(Math.random() * (n - 4)) + 2
         a = 2n + randBelow(n - 4n)
         x = modPow(a, d, n)
         if (x === 1n || x === n - 1n) {
            continue
         }
         let jj: number = 0
         let broken = false
         for (jj = 0; jj < r - 1; jj++) {
            x = modPow(x, 2n, n)
            if (x === n - 1n) {
               broken = true
               break
            }
         }
         if (broken) {
            return false
         }
      }
      return true
   }

   /**
    * Generates a random prime of the specified bit length."""
    */
   private generateLargePrime(): bigint {
      const max: bigint = 1n << BigInt(this.bitLength)
      const min: bigint = max / 2n
      const spread: bigint = max - min

      while (true) {
         let p: bigint = randBelow(spread) + min
         p |= (1n << BigInt(this.bitLength - 1)) | 1n
         if (this.isMillerRabinPassed(p, 40)) {
	    if (checkPrimeSync(p)) {
	       console.log("Miller Rabin and crypto both passed ", p)
               return p
	    } else {
	       console.log("Miller Rabin passed ", p, " but crypto did not!")
            }
         } else if(checkPrimeSync(p)) {
	    console.log("Crypto passed ", p, " but Miller Rabin did not!")
	 } else {
	    console.log("Both Miller Rabin and crypto failed ", p)
	 }
      }
   }

   /**
    * Infinite generator using a dictionary-based sieve
    */
   private *primeGen(): Generator<bigint> {
      yield 2n
      const D: Map<bigint, bigint> = new Map()
      let q: bigint = 3n
      while (true) {
         if (!D.has(q)) {
            yield q
            D.set(q * q, 2n * q)
         } else {
            const p: bigint = D.get(q) ?? -1n
            D.delete(q)
            let x: bigint = q + p
            while (D.has(x)) {
               x = x + p
            }
            D.set(x, p)
         }
         q = q + 2n
      }
   }

   /**
    * Factors p-1 using the shrinking-bound sieve generator.
    */
   private factorizePMinusOne(): Set<bigint> {
      let n: bigint = this.p - 1n
      const factors: Set<bigint> = new Set()
      let limit: bigint = sqrt(n)
      let prime: bigint = -1n

      for (prime of this.primeGen()) {
         if (prime > limit) {
            break
         }
         if (n % prime === 0n) {
            factors.add(prime)
            while (n % prime === 0n) {
               n = (n - (n % prime)) / prime
               limit = sqrt(n)
            }
         }
      }

      if (n > 1n) {
         factors.add(n)
      }
      return factors
   }

   /**
    * Searches for a generator using the p-1 factor test."""
    */
   private findPrimitiveRoot(): bigint {
      const phi: bigint = this.p - 1n
      const factors: bigint[] = [...this.factorsOfPMinusOne]
      // In a large prime field, ~30-50% of numbers are generators.
      // We'll find one quickly.
      // Check if g^(phi/q) != 1 for all factors q
      while (true) {
         const g: bigint = randBelow(this.p - 3n) + 2n
         if (
            factors.every((q: bigint): boolean => {
               return modPow(g, (phi - (phi % q)) / q, this.p) !== 1n
            })
         ) {
            return g
         }
      }
   }
}

function randBelow(n: bigint): bigint {
   // console.log("Call randBelow ", n)
   const slice = Number((n - (n % BIG_MAX_SAFE)) / BIG_MAX_SAFE)
   const scale: bigint = BigInt(
      Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
   )
   const skew: bigint = BigInt(Math.floor(Math.random() * slice))
   return skew + (n * scale) / BIG_MAX_SAFE
}

function sqrt(value: bigint): bigint {
   if (value < 2n) {
      return value
   }

   if (value < 16n) {
      return BigInt(Math.sqrt(Number(value)) | 0)
   }

   let x0, x1
   if (value < 4503599627370496n) {
      // 1n<<52n
      x1 = BigInt(Math.sqrt(Number(value)) | 0) - 3n
   } else {
      const vLen: number = value.toString().length
      if (vLen % 2 === 0) {
         x1 = 10n ** BigInt(vLen / 2)
      } else {
         x1 = 4n * 10n ** BigInt((vLen / 2) | 0)
      }
   }

   do {
      x0 = x1
      x1 = (value / x0 + x0) >> 1n
   } while (x0 !== x1 && x0 !== x1 - 1n)
   return x0
}

// const alot = new PrimeFieldGenerator(32)
// console.log(alot.p, alot.generator)

const primeFieldStorage = new AsyncLocalStorage<RandomPrimeField>()

export function getMyPrimeField(): RandomPrimeField {
   return primeFieldStorage.run(
      new RandomPrimeField(BASE_PRIME_FIELD_BITS),
      (): RandomPrimeField => {
         let rpField: RandomPrimeField | undefined =
            primeFieldStorage.getStore()
         if (rpField == null) {
            console.error("No RandomPrimeField found in AsyncLocalStorage??")
            rpField = new RandomPrimeField(BASE_PRIME_FIELD_BITS)
         }
         return rpField
      },
   )
}
