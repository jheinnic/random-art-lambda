import { VennJust, VennNot } from "./SetTheory.js"

const SetA: unique symbol = Symbol("SetA")
const SetB: unique symbol = Symbol("SetB")
const SetC: unique symbol = Symbol("SetC")

type TypeA = typeof SetA
type TypeB = typeof SetB
type TypeC = typeof SetC
type AllKnown = TypeA | TypeB | TypeC

export type A = VennJust<string, AllKnown, TypeA>
export type B = VennJust<string, AllKnown, TypeB>
export type C = VennJust<string, AllKnown, TypeC>

export type NotA = VennNot<string, AllKnown, TypeA>
export type NotB = VennNot<string, AllKnown, TypeB>
export type NotC = VennNot<string, AllKnown, TypeC>

export type AandBbutnotC = A & B & NotC

function blessA(str: string): str is A {
   return true
}
function blessB(str: string): str is B {
   return true
}

function blessNotC(str: string): str is NotC {
   return true
}

export const listA: A[] = new Array<A>()
export const listABnotC: AandBbutnotC[] = new Array<AandBbutnotC>()

function needWideList(list: A[]): void {
   console.log(list)
}

function needNarrowList(list: AandBbutnotC[]): void {
   console.log(list)
}

function wideVal(value: A): void {
   console.log(value)
}

function narrowVal(value: AandBbutnotC): void {
   console.log(value)
}

function curryWide(fn: (value: A) => void, value: A) {
   return () => {
      fn(value)
   }
}

function curryNarrow(fn: (value: AandBbutnotC) => void, value: AandBbutnotC) {
   return () => {
      fn(value)
   }
}

function pushWide(value: A): void {
   listA.push(value)
}

function pushNarrow(value: AandBbutnotC): void {
   listABnotC.push(value)
}

const someString = "SomeString"
if (blessA(someString)) {
   const altString: A = someString
   wideVal(someString)
   // narrowVal(someString)
   listA.push(someString)
   // listABnotC.push(someString)

   const inject1A = curryWide(pushWide, someString)
   inject1A()
   // const inject2A = curryNarrow(pushWide, someString)
   // inject2A()
   // const inject3A = curryNarrow(pushNarrow, someString)
   // inject3A()
   // const inject4A = curryWide(pushNarrow, someString)
   // inject4A()
   if (blessB(someString)) {
      if (blessNotC(someString)) {
         wideVal(someString)
         narrowVal(someString)
         listA.push(someString)
         listABnotC.push(someString)

         const inject1B = curryWide(pushWide, someString)
         inject1B()
         const inject2B = curryNarrow(pushWide, someString)
         inject2B()
         const inject3B = curryNarrow(pushNarrow, someString)
         inject3B()
         // const inject4B = curryWide(pushNarrow, someString)
         // inject4B()

         const inject1C = curryWide(pushWide, altString)
         inject1C()
         // const inject2C = curryNarrow(pushWide, altString)
         // inject2C()
         // const inject3C = curryNarrow(pushNarrow, altString)
         // inject3C()
         // const inject4C = curryWide(pushNarrow, altString)
         // inject4C()
      }
   }
}

needWideList(listA)
needNarrowList(listABnotC)
