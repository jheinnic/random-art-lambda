import "medium"
import { Transducer } from "transducers-js"
import { AnyFunc } from "simplytyped"

declare module "medium" {
  export interface Chan<S = any, T = S> extends Promise<T | symbol> {}

  export type ChanBuffer = object

  export interface BufferFactories {
    unbuffered: () => ChanBuffer
    fixed: (num: number) => ChanBuffer
    sliding: (num: number) => ChanBuffer
    dropping: (num: number) => ChanBuffer
  }

  export const buffers: BufferFactories

  export type ChanBufferLike = number | ChanBuffer
  /**
   * Creates a channel. All arguments are optional.
   *
   * numOfBuffer - Any number or buffer. A number is a shortcut for buffers.fixed(number).
   * xducer - a transducer to process/filter values with.
   */
  export function chan<S = any, T = S> (
    numOrBuffer?: ChanBufferLike,
    xducer?: Transducer<S, T>
  ): Chan<T>

  /** Puts a value onto a channel. Returned promise resolves to true if successful, or false if the channel is closed. */
  export function put<S = any, T = S> (ch: Chan<S, T>, val: S): Promise<boolean>

  /** Takes a value from a channel. Returned Promise resolves to taken value or CLOSED constant if the channel is closed. */
  export function take<T = any> (ch: Chan<any, T>): Promise<T | typeof CLOSED>

  /** Immediately invokes (and returns) given async function. */
  export function go<T> (func: AnyFunc<Promise<T>>): Promise<T>

  /** Creates a promise that will resolve successfully after ms milliseconds. */
  export function sleep (ms: number): Promise<void>

  /** A constant, which all takes on a closed channel receive instead of a value. */
  const CLOSED: symbol
  // export type CLOSED = typeof CLOSED

  /**
   * Closes a channel. This causes:
   * -- all puts and pending puts to resolve to false
   * -- all takes and pending takes to resolve to the CLOSED constant
   */
  export function close (ch: Chan<unknown, unknown>): void

  /** Makes a new channel, same as the old channel. */
  export function clone<S = unknown, T = S> (ch: Chan<S, T>): Chan<S, T>

  export type Alt<T = unknown> =
    | Chan<unknown, T>
    | Promise<T>
    | [Chan<T, unknown>, T]

  export type AsyncAlt<T = any> = Promise<
  [T, Chan<unknown, T> | Chan<T, unknown> | Promise<T>]
  >

  /**
     * Like alts in Clojure's core-async.
     *
     * ports can be a channel to take from, a promise to resolve, or an array to put data onto a channel, like [ theChannel, valueToPut ].
     *
     * If none of them have a pending value, it will resolve with whichever channel receives a value next.
     *
     * If one of the channels has a pending value already, it will simply resolve to that.
     *
     * If more than one channel has a pending value, it selects one in a non-deterministic fashion.
     *
     * Always resolves with a double of [ theResolvedValue, theSourceChannel ].
     *
     * All non-winning actions will be canceled so that their data does not go missing.
     export function any(...ports) -> Promise -> [theResolvedValue, theSourceChannelOrPromise]
     */
  export function any<S1 = any> (...port: Array<Alt<S1>>): AsyncAlt<S1>
  export function any<S1 = any, S2 = any> (
    port1: Alt<S1>,
    ...port2: Array<Alt<S2>>
  ): AsyncAlt<S1 | S2>
  export function any<S1 = any, S2 = any, S3 = any> (
    port1: Alt<S1>,
    port2: Alt<S2>,
    ...port3: Array<Alt<S3>>
  ): AsyncAlt<S1 | S2 | S3>
  export function any<S1 = any, S2 = any, S3 = any, S4 = any> (
    port1: Alt<S1>,
    port2: Alt<S2>,
    port3: Alt<S3>,
    ...port4: Array<Alt<S4>>
  ): AsyncAlt<S1 | S2 | S3 | S4>
  export function any<S1 = any, S2 = any, S3 = any, S4 = any, S5 = any> (
    port1: Alt<S1>,
    port2: Alt<S2>,
    port3: Alt<S3>,
    port4: Alt<S4>,
    ...ports: Array<Alt<S5>>
  ): AsyncAlt<S1 | S2 | S3 | S4 | S5>

  type NotFalse<T> = T extends false ? never : false extends T ? never : T

  export type RepeatFn =
    | (() => false | undefined)
    | (() => Promise<false> | Promise<void>)

  export type SeededRepeat<Seed = unknown> =
    | ((seed: NotFalse<Seed>) => Seed | false)
    | ((seed: NotFalse<Seed>) => Promise<Seed | false>)

  /**
   * I don't love while loops, so I use this instead.
   *
   * As a bonus, you can track state without mutations! Return a value other than false, and it will be available as the argument to your callback async function.
   * Pass in a seed value as the second argument to repeat.
   */
  export function repeat (func: RepeatFn): Promise<undefined>
  export function repeat<Seed = unknown> (
    func: SeededRepeatFn<Seed>,
    seed: Seed
  ): Promise<undefined>

  /**
   * RepeatTakeFn are used as an argument to repeatTake, alongside a Chan that
   * provides its input.  Calling repeatTake() begins an asynchronous loop that
   * calls its RepeatTakeFn with values read from Chan provided as first argument.
   *
   * If a RepeatTakeFn returns nothing, loop continues with next value read from
   * Chan.  If RepeatTake returns false instead, asynchronous loop ends and Promise
   * returned to repeatTake()'s caller resolves.
   */
  export type RepeatTakeFn<Take = unknown> =
    | ((value: Take) => false | undefined)
    | ((value: Take) => Promise<false> | Promise<void>)

  /**
   * SeededRepeatFn is like RepeatTakeFn except to continue the loop a value of
   */
  export type SeededRepeatTakeFn<Take = unknown, Seed = unknown> =
    | ((take: Take, seed: NotFalse<Seed>) => Seed | false)
    | ((take: Take, seed: NotFalse<Seed>) => Promise<Seed | false>)

  /**
   * This is just like repeat above, except that before it repeats, it waits for a successful take on the given channel.
   * Then it passes this taken value in as the first argument, with any local state being passed as the second argument.
   *
   * See the ping/pong example above to see this in action.
   */
  export function repeatTake<T = unknown> (
    ch: Chan<unknown, T>,
    fn: RepeatTakeFn<T>
  ): Promise<void>
  export function repeatTake<
    T = unknown,
    S extends Exclude<unknown, false> = unknown
  > (ch: Chan<unknown, T>, fn: SeededRepeatTakeFn<T, S>, seed: S): Promise<void>

  /**
   * Creates a new channel that will receive all puts to the received channels.
   */
  export function merge<T1 = unknown, T2 = T1> (
    ch1: Chan<unknown, T1>,
    ch2: Chan<unknown, T2>
  ): Chan<unknown, T1 | T2>
  export function merge<T1 = unknown, T2 = T1, T3 = T2> (
    ch1: Chan<unknown, T1>,
    ch2: Chan<unknown, T2>,
    ch3: Chan<unknown, T3>
  ): Chan<unknown, T1 | T2 | T3>
  export function merge<T1 = unknown, T2 = T1, T3 = T2, T4 = T3> (
    ch1: Chan<unknown, T1>,
    ch2: Chan<unknown, T2>,
    ch3: Chan<unknown, T3>,
    ch4: Chan<unknown, T4>
  ): Chan<unknown, T1 | T2 | T3 | T4>
  export function merge<T1 = unknown, T2 = T1, T3 = T2, T4 = T3, T5 = T4> (
    ch1: Chan<unknown, T1>,
    ch2: Chan<unknown, T2>,
    ch3: Chan<unknown, T3>,
    ch4: Chan<unknown, T4>,
    ...chs: Array<Chan<unknown, T5>>
  ): Chan<unknown, T1 | T2 | T3 | T4 | T5>
}
