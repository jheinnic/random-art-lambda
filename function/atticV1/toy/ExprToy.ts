import { VM } from "vm2"
import { compile, jsep, Context } from "jse-eval"
import jsepTemplate from "@jsep-plugin/template"

jsep.plugins.register(jsepTemplate)

class Woot {
   constructor(
      public a: number,
      public b: number,
   ) {}

   add(): number {
      return this.a + this.b
   }
}

const ctx = new Woot(3, 5)
const test = compile("add()")
console.log(test(ctx as unknown as Context))

/*
const malice = compile(
   "this.constructor.constructor('return process')().exit()",
)
*/
const malice = compile("process_exit()")
malice({
   process_exit: () => {
      process.exit()
   },
})

console.log("Survivor!")
