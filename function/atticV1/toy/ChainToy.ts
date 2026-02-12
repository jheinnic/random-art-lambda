import { Type } from "@nestjs/common"

abstract class Middleware<Input extends object, Output extends object> {
   // constructor() {} //private readonly input:Type<Input>, private readonly output: Type<Output> ) { }

   abstract handle(value: Input): Output
}

class Base {
   constructor(public readonly seeds: [number, string, number]) {}
}

class Abc {
   constructor(public readonly color: string) {}
}

class Foo {
   constructor(
      public readonly thing: number,
      public readonly size: number,
   ) {}
}

class Barn {
   constructor(public readonly name: string) {}
}

class Bank {
   constructor(
      public readonly balance: number,
      public readonly accountId: string,
   ) {}
}

class Brunch {
   constructor(public readonly guests: Array<[string, number]>) {}
}

class Entry extends Middleware<Base, Barn> {
   handle(value: Base): Barn {
      return new Barn(value.constructor.name)
   }
}

class Alpha extends Middleware<Base, Abc> {
   handle(value: Base): Abc {
      return new Abc("purple")
   }
}

class Beta extends Middleware<Barn & Base, Foo> {
   handle(value: Base & Barn): Foo {
      return new Foo(7, 7)
   }
}

class Zeta extends Middleware<Abc & Foo, Bank & Brunch> {
   handle(value: Abc & Foo): Bank & Brunch {
      return new Brunch([
         ["Ted", 43.3],
         ["Ellen", 45.4],
         ["Craig", 38.77],
         ["Sarah", 41.1],
      ]) as any as Bank & Brunch
   }
}

const chainOne = [new Entry(), new Alpha(), new Beta(), new Zeta()] as const
const chainTwo = [new Zeta(), new Alpha(), new Entry(), new Beta()] as const
const chainThree = [new Entry(), new Beta(), new Zeta(), new Alpha()] as const

type ThisInput<C extends ReadonlyArray<Middleware<any, any>>> = C extends [
   Middleware<infer T, any>,
   ...ReadonlyArray<Middleware<any, any>>,
]
   ? T
   : never

type FinalOutput<C extends ReadonlyArray<Middleware<any, any>>> =
   FinalOutputStep<NextMiddleware<C>, MiddlewareOutput<TopMiddleware<C>>>
type FinalOutputStep<
   C extends ReadonlyArray<Middleware<any, any>>,
   S,
> = C["length"] extends 0
   ? S
   : FinalOutputStep<NextMiddleware<C>, S & MiddlewareOutput<TopMiddleware<C>>>

type TopMiddleware<C extends ReadonlyArray<Middleware<any, any>>> = C extends [
   infer T,
   ...ReadonlyArray<Middleware<any, any>>,
]
   ? T
   : never
type NextMiddleware<C extends ReadonlyArray<Middleware<any, any>>> = C extends [
   Middleware<any, any>,
   ...infer T,
]
   ? T
   : []

type MiddlewareInput<M extends Middleware<any, any>> =
   M extends Middleware<infer T, any> ? T : never
type MiddlewareOutput<M extends Middleware<any, any>> =
   M extends Middleware<any, infer T> ? T : never

// eslint-disable-next-line @typescript-eslint/array-type
type IsViable<C extends ReadonlyArray<Middleware<any, any>>> = IsViableStep<
   C,
   MiddlewareInput<TopMiddleware<C>>
>
type IsViableStep<
   C extends ReadonlyArray<Middleware<any, any>>,
   S,
> = C extends [Middleware<infer Input, infer Output>, ...infer R]
   ? S extends Input
      ? IsViableStep<NextMiddleware<C>, S & Output>
      : false
   : true

export const isOne: IsViable<typeof chainOne> = true
export const isTwo: IsViable<typeof chainTwo> = false
export const isThree: IsViable<typeof chainThree> = true

export const blah: NextMiddleware<typeof chainOne> = true

export type Lucky = FinalOutput<typeof chainOne>
export const thing: Lucky = {} as any as Base & Abc & Foo & Barn & Bank & Brunch

const NULL_PROTO = Object.getPrototypeOf({})

class Executor {
   process<Chain extends ReadonlyArray<Middleware<any, any>>>(
      chain: Chain,
      initial: ThisInput<Chain>,
   ): void {
      // FinalOutput<Chain> {
      if (chain.length === 0) {
         return undefined as never
      }
      return this.beginNext<ThisInput<Chain>, Chain>(chain, initial)
   }

   beginNext<State, Chain extends ReadonlyArray<Middleware<any, any>>>(
      chain: Chain,
      input: State & MiddlewareInput<TopMiddleware<Chain>>,
   ): void {
      const nextMW: TopMiddleware<Chain> = chain[0] as TopMiddleware<Chain>
      const output: MiddlewareOutput<TopMiddleware<Chain>> =
         nextMW.handle(input)
      return this.onReturn<
         State & MiddlewareInput<TopMiddleware<Chain>>,
         Chain
      >(chain, input, output)
   }

   onReturn<State, Chain extends ReadonlyArray<Middleware<any, any>>>(
      chain: Chain,
      state: State,
      output: MiddlewareOutput<TopMiddleware<Chain>>,
   ): void {
      const newState = Object.assign(output, state)
      // Use Object.getPrototypeOf/setPrototypeOf instead of __proto__
      const stateProto = Object.getPrototypeOf(state)
      const outputProto = Object.getPrototypeOf(output)

      // Transfer properties
      Object.assign(output, state)

      if (outputProto === NULL_PROTO) {
         // If the output is a "clean" object, point its inheritance to the state's prototype
         Object.setPrototypeOf(output, stateProto)
      } else if (outputProto != null && stateProto != null) {
         // Otherwise, merge the prototype properties themselves
         Object.assign(outputProto, stateProto)
      }
      if (chain.length === 0) {
         return output
      }
      const [head, ...tail] = chain
      return this.beginNext<
         State & MiddlewareOutput<TopMiddleware<Chain>>,
         NextMiddleware<Chain>
      >(tail as NextMiddleware<Chain>, output)
   }
}
