import "./genjs6.js"

declare module "./genjs6.js" {
   export type GenModel = object
   export type Prefix = readonly Uint8ClampedArray | readonly Uint8Array
   export type Suffix = readonly Uint8ClampedArray | readonly Uint8Array

   export function newNewPicture(prefix: Prefix, suffix: Suffix): GenModel
   export function newPicture(prefix: Prefix, suffix: Suffix): GenModel
   export function oldPicture(phrase: string): GenModel
   export function computePixel(
      genModel: GenModel,
      x: number,
      y: number,
   ): [number, number, number] // { red: number, green: number, blue: number }
   export function phraseToSeed(phrase: string): [Prefix, Suffix] // [prefix: number[], suffix: number[]]
   export function fullEval(fn: Function): Function
   export function partialEval(fn: Function): Function

   export function substringChars(
      phase: string,
      offset: number,
      len: number,
   ): Prefix
}
