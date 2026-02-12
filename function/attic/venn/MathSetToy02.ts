import { NominalVennIn, VennDimension, VennJust, VennNot } from "./SetTheory.js"

enum Colors {
   Red = "Red",
   Blue = "Blue",
   Green = "Green",
}

const SetRed: unique symbol = Symbol("SetRed")
const SetBlue: unique symbol = Symbol("SetBlue")
const SetGreen: unique symbol = Symbol("SetGreen")

enum Shapes {
   Circle = "Circle",
   Square = "Square",
   Triangle = "Triangle",
}

const SetCircle: unique symbol = Symbol("SetCircle")
const SetSquare: unique symbol = Symbol("SetSquare")
const SetTriangle: unique symbol = Symbol("SetTriangle")

enum Sizes {
   Small = "Small",
   Medium = "Medium",
   Large = "Large",
}

const SetSmall: unique symbol = Symbol("SetSmall")
const SetMedium: unique symbol = Symbol("SetMedium")
const SetLarge: unique symbol = Symbol("SetLarge")

type TypeRed = typeof SetRed
type TypeBlue = typeof SetBlue
type TypeGreen = typeof SetGreen

type TypeCircle = typeof SetCircle
type TypeSquare = typeof SetSquare
type TypeTriangle = typeof SetTriangle

type TypeSmall = typeof SetSmall
type TypeMedium = typeof SetMedium
type TypeLarge = typeof SetLarge


type AllColors = TypeRed | TypeBlue | TypeGreen
type AllShapes = TypeCircle | TypeSquare | TypeTriangle
type AllSizes = TypeSmall | TypeMedium | TypeLarge

type AllKnown =
   | AllColors
   | AllShapes
   | AllSizes

export type Red = VennDimension<string, AllKnown, AllColors, TypeRed>
export type Blue = VennDimension<string, AllKnown, AllColors, TypeBlue>
export type Green = VennDimension<string, AllKnown, AllColors, TypeGreen>

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

export interface HasShape {
   shape: Shapes
}

export interface BlueLike {
   color: Colors.Blue
}

export type Card {
   shape: Shapes
   color: Colors
   size: Sizes
}