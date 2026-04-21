export interface A {
   a: number
   c: boolean
   d: string
}
export interface B {
   b: boolean
   // c: number
   d: string
}

export type C = A & B

export const c: C = {
   a: 4,
   b: false,
   c: true, // "loook",
   d: "now",
}

type A1 =
   | string
   | (symbol & {
        a: string
        c?: string
        d?: string
        e?: string
        f: string
        h?: string
     })
type B1 =
   | number
   | (symbol & {
        a?: string
        b?: string
        c: string
        g: string
        h?: string
     })

type C1 = A1 & B1

export const c21: C1 = Object.assign(Symbol("4"), {
   h: "goo",
   a: "sd",
   f: "dfw",
   c: "doo",
   g: "noo",
   b: "b",
   d: "d",
   e: "e",
   i: "i",
})
export const c22: C1 = Object.assign(Symbol("4"), {
   h: "koo",
   a: "doo",
   f: "noo",
   c: "doo",
   g: "noo",
})
c21.a = "minae"
c21.b = "no"
c21.e = "no"
c21.g = "bad"
c22.g = "good"
c21.i = "owow"
console.log(typeof c21)
console.log(c21)
delete c21.b
delete c21.d
delete c21.e
delete c21.h
console.log(typeof c21)
console.log(c21)
delete c21.a
delete c21.c
delete c21.f
delete c21.g
delete c21.i
console.log(typeof c21)
console.log(c21)
