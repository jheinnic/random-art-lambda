import "reflect-metadata"
import { randomInt } from "node:crypto"
import { plainToInstance } from "class-transformer"

const FOO: unique symbol = Symbol("FOO")
const ZOO: unique symbol = Symbol("ZOO")
const WOO: unique symbol = Symbol("WOO")

export class SymTest {
   private [FOO]: number = randomInt(1024 * 1024 * 1024)
   public [ZOO]: number = 20
   public [WOO]: string = "wooky"
   public foo: number = randomInt(1024 * 1024 * 1024)
   private readonly burk: string = "wooky"

   constructor(
      public readonly name: string,
      public readonly size: number,
      public readonly krot?: string,
      jaso?: string,
      paso: number = 50,
   ) {
      if (paso !== 50) {
         this[FOO] = 300
      }
      if (jaso != null) {
         this[WOO] = jaso
      }
      this.burk = jaso ?? "froik"
      this[ZOO] = paso ?? 19
   }
}

const a1 = new SymTest("noodle", 19)
const a2 = new SymTest("brain", 24, "dot", "zoink", 100)

const b1 = JSON.stringify(a1)
console.log(b1)
const c1 = JSON.parse(b1)
console.log(a1, " <-> ", c1)

const b2 = JSON.stringify(a2)
console.log(b2)
const c2 = JSON.parse(b2)
console.log(a2, " <-> ", c2)

const d1 = Object.assign(a1, c2)
console.log(a1)
console.log(d1)
console.log(typeof a1)
console.log(typeof b1)
console.log(typeof c1)
console.log(typeof d1)
console.log(d1 == a2)
console.log(c2)
console.log(typeof a2)
console.log(typeof b2)
console.log(typeof c2)

const d2 = plainToInstance(SymTest, c2)
console.log(d2)
delete c2.burk
const e2 = plainToInstance(SymTest, c2)
c2.burk = "a noid"
const f2 = plainToInstance(SymTest, c2)

console.log("a2 is ", a2)
console.log("b2 is ", b2)
console.log("c2 is ", c2)
console.log("d2 is ", d2)
console.log("e2 is ", e2)
console.log("f2 is ", f2)
