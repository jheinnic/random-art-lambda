interface Break<I, O> {
   get: (name: string) => O

   set: (name: string, value: I) => boolean

   convert: (source: O[]) => I[]

   split: (source: I) => [O, O]

   merge: (...sources: I[]) => O
}

interface A {
   a: number
}

interface B extends A {
   b: number
}

class CA implements A, C {
   a: number = 0
   b: number = 0
   c: number = 0
}

class BB implements B {
   a: number = 1
   b: number = -1
}

class BB2 extends BB {}

class BB3 extends BB implements D {
   c: number = 0
}

interface C extends B {
   c: number
}

interface D extends CA {}

const x: Break<B, B> = {} as unknown as Break<B, B>
const bb3 = new BB3()
const bb0 = new BB()
const ca = new CA()
let a1: A = ca
let a2: A = bb3
let c1: C = ca
let b1: B = bb0

a2 = x.get("foo")
b1 = x.get("foo")
c1 = x.get("foo")
x.set("foo", a2)
x.set("foo", b1)
x.set("foo", c1)
const _xab: Break<A, B> = x set
const _xcb: Break<C, B> = x conv
const _xba: Break<B, A> = x conv
const _xbc: Break<B, C> = x get
const _xac: Break<A, C> = x get
const _xca: Break<C, A> = x conv

a2 = xca.get("fdo")
c1 = xca.get("bad")
b1 = xca.get("No")
xca.set("bad", a2)
xca.set("no", b1)
xca.set("ok", c1)

a2 = xac.get("fdo")
c1 = xac.get("bad")
b1 = xac.get("No")
xac.set("bad", a2)
xac.set("no", b1)
xac.set("ok", c1)
