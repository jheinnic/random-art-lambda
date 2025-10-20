interface Foo<T extends string> {
   foo: () => T
}

interface FooTyped {
   [K: `${string}`]: Foo<typeof K>
}

// type FooBase = Record<string, { foo: () => string }>
type FooBase = {
   [K in Exclude<keyof any, number | symbol>]: Foo<`${K}`>
}

// 2. Class Bar takes a generic F that must be a FooBase, but
//    also *intersects* with the desired literal type mapping.
class Bar<
   F extends FooTyped, // & {
   // [K in Exclude<keyof F, symbol>]: Foo<`${K}`>
   // K extends infer R
   // ? Foo<R extends string ? R : never>
   // : never
   // },
> {
   private readonly state: F = {} as unknown as F

   set<K extends string>(key: K, item: F[K]): void {
      this.state[key] = item
   }

   mo<K extends string>(key: K): ReturnType<Foo<`${K}`>["foo"]> {
      return this.state[key].foo() as ReturnType<Foo<`${K}`>["foo"]>
   }

   do<K extends string>(key: K): ReturnType<F[`${K}`]["foo"]> {
      return this.state[key].foo() as ReturnType<F[`${K}`]["foo"]>
   }
}

class Bip implements Foo<"alpha"> {
   foo(): "alpha" {
      return "alpha"
   }
}

class Bor implements Foo<string> {
   foo(): string {
      return "fd"
   }
}

class Gen<I extends string> implements Foo<I> {
   constructor(private readonly val: I) {}
   foo(): I {
      return this.val
   }
}

export const abc: Bar<FooTyped> = new Bar()
abc.set("alpha", new Bip())
export let loggy = abc.do("alpha")
loggy = "dog"
loggy = "alpha"

export const dbc: Bar<Bor> = new Bar(new Bor())

export const logg = dbc.do()

const big = new Bip()
const bb: FooTyped = {
   alpha: big,
}
const laj = bb.alpha.foo()
const js = big.foo()

interface Factory<T> {
   get: () => T

   net: (K: string) => T
}

class AFactory<I extends string> implements Factory<Foo<string>> {
   constructor(private readonly val: I) {}

   get(): Foo<I> {
      return new Gen<I>(this.val)
   }

   net(K: string): Foo<typeof K> {
      return new Gen<typeof K>(K)
   }
}

class B<Q extends Factory<any>> {
   constructor(private readonly it: Q) {}

   fook(): ReturnType<ReturnType<Q["get"]>["foo"]> {
      return this.it.get()
   }

   look<N extends string>(a: N): ReturnType<ReturnType<Q[N]>["foo"]> {
      const f: LitStr<typeof a> = a
      return this.it.net(f)
   }
}

type LitStr<N extends string> = N extends infer R ? R : never

const bar: AFactory<"alpha"> = new AFactory("alpha")
const bar2: B<AFactory<"alpha">> = new B(bar)
const bar3 = new B(bar)
const nk = bar3.look("alpha")
