import "./genjs6.js"

declare module "./genjs6.js" {
  export type GenModel = object

  export function newNewPicture (prefix: number[], suffix: number[]): GenModel
  export function newPicture (prefix: number[], suffix: number[]): GenModel
  export function oldPicture (phrase: string): GenModel
  export function computePixel (
    genModel: GenModel,
    x: number,
    y: number
  ): [number, number, number]  // { red: number, green: number, blue: number }
  export function phraseToSeed (
    phrase: string
  ): [number[], number[]] // [prefix: number[], suffix: number[]]
  export function fullEval (fn: Function): Function
  export function partialEval (fn: Function): Function
}
