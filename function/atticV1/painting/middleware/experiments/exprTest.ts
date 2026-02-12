import jseEval, { Context } from "jse-eval"

class Thing {
   merge: (...args: [string]) => string

   constructor(
      public readonly one: string,
      public readonly two: string,
   ) {
      this.merge = (...args: [string]): string => {
         return this._merge(...args)
      }
   }

   _merge(join: string): string {
      return this.one + join + this.two
   }
}

const exprOne = jseEval.compile("one")
const exprTwo = jseEval.compile("two")
const exprMerge = jseEval.compile("merge(', ')")

const thing = new Thing("alpha", "abet") as unknown as Context
const context = { ...thing }

console.log(exprOne(context))
console.log(exprTwo(context))
console.log(exprMerge(context))
