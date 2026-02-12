import seedrandom from "seedrandom"

export type RgbTuple = [number, number, number]

export interface GenModel {
   computePixel: (x: number, y: number) => RgbTuple
}

type Op = (x: number, y: number) => number

export class OpenSourceGenModel implements GenModel {
   private readonly redTree: Op
   private readonly greenTree: Op
   private readonly blueTree: Op
   private readonly colorPrng: seedrandom.PRNG
   private readonly structurePrng: seedrandom.PRNG

   constructor(
      prefixBuffer: Uint8ClampedArray,
      suffixBuffer: Uint8ClampedArray,
   ) {
      // Convert buffers to hex strings to ensure stable seeding across Node environments
      const colorSeed = Buffer.from(prefixBuffer).toString("base64")
      const structureSeed = Buffer.from(suffixBuffer).toString("base64")

      this.colorPrng = seedrandom(colorSeed)
      this.structurePrng = seedrandom(structureSeed)

      // Build independent trees for each channel
      this.redTree = this.buildTree(0)
      this.greenTree = this.buildTree(0)
      this.blueTree = this.buildTree(0)
   }

   private buildTree(depth: number): Op {
      const MAX_DEPTH = 8
      // Use structure PRNG to determine tree architecture
      const p = this.structurePrng.quick()

      // Terminal nodes: Variables or Constants
      if (depth > MAX_DEPTH || p < 0.2) {
         const terminalType = this.structurePrng.quick()
         if (terminalType < 0.4) return (x, y) => x
         if (terminalType < 0.8) return (x, y) => y

         // Generate a constant based on the Color PRNG (Palette control)
         const constant = this.colorPrng.quick() * 2 - 1
         return () => constant
      }

      const left = this.buildTree(depth + 1)
      const right = this.buildTree(depth + 1)

      // Grammar: Select operations based on structure PRNG
      const opIdx = Math.floor(this.structurePrng.quick() * 10)
      switch (opIdx) {
         case 0:
            return (x, y) => Math.sin(Math.PI * left(x, y))
         case 1:
            return (x, y) => Math.cos(Math.PI * left(x, y))
         case 2:
            return (x, y) => (left(x, y) + right(x, y)) / 2
         case 3:
            return (x, y) => left(x, y) * right(x, y)
         case 4:
            return (x, y) => Math.atan2(left(x, y), right(x, y)) / Math.PI
         case 5:
            return (x, y) => Math.atan2(right(x, y), left(x, y)) / Math.PI
         case 6:
            return (x: number, y: number): number =>
               (right(x, y) * right(x, y)) / left(x, y)
         case 7:
            return (x: number, y: number): number =>
               Math.log10(Math.abs(left(x, y) * right(x, y)))
         case 8:
            return (x: number, y: number): number =>
               Math.pow(right(x, y), 3) -
               2 * left(x, y) * right(x, y) +
               3 * (left(x, y) * left(x, y)) -
               5 * right(x, y)
         default:
            return (x, y) => Math.abs(left(x, y))
      }
   }

   public computePixel(x: number, y: number): RgbTuple {
      const toByte = (v: number): number => {
         const clamped = Math.max(-1, Math.min(1, v))
         return Math.floor((clamped + 1) * 127.5)
      }

      return [
         toByte(this.redTree(x, y)),
         toByte(this.greenTree(x, y)),
         toByte(this.blueTree(x, y)),
      ]
   }
}
