declare module "medium" {
   export type Chan<T = unknown> = object

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
   export function chan<T = unknown>(numOrBuffer?: ChanBufferLike): Chan<T>

   /** Puts a value onto a channel. Returned promise resolves to true if successful, or false if the channel is closed. */
   export function put<T = unknown>(ch: Chan<T>, val: T): Promise<boolean>

   /** Takes a value from a channel. Returned Promise resolves to taken value or CLOSED constant if the channel is closed. */
   export function take<T = unknown>(ch: Chan<T>): Promise<T | typeof CLOSED>

   /** Immediately invokes (and returns) given async function. */
   export function go<T>(func: () => Promise<T>): Promise<T>

   /** Creates a promise that will resolve successfully after ms milliseconds. */
   export function sleep(ms: number): Promise<void>

   /** A constant, which all takes on a closed channel receive instead of a value. */
   const CLOSED: symbol
   // export type CLOSED = typeof CLOSED

   /**
    * Closes a channel. This causes:
    * -- all puts and pending puts to resolve to false
    * -- all takes and pending takes to resolve to the CLOSED constant
    */
   export function close<T = unknown>(ch: Chan<T>): void

   /** Makes a new channel, same as the old channel. */
   export function clone<T = unknown>(ch: Chan<T>): Chan<T>

   export type Alt<T = unknown> = Chan<T> | Promise<T> | [Chan<T>, T]

   export type AsyncAlt<T = unknown> = Promise<
      [T | boolean | typeof CLOSED, Chan<T> | Promise<T>]
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
   export function any<S1 = unknown>(...port: Array<Alt<S1>>): AsyncAlt<S1>
   export function any<S1 = unknown, S2 = S1>(
      port1: Alt<S1>,
      ...port2: Array<Alt<S2>>
   ): AsyncAlt<S1 | S2>
   export function any<S1 = unknown, S2 = S1, S3 = S2>(
      port1: Alt<S1>,
      port2: Alt<S2>,
      port3: Alt<S3>,
   ): AsyncAlt<S1 | S2 | S3>
   export function any<S1 = unknown, S2 = S1, S3 = S2, S4 = S3>(
      port1: Alt<S1>,
      port2: Alt<S2>,
      port3: Alt<S3>,
      port4: Alt<S4>,
   ): AsyncAlt<S1 | S2 | S3 | S4>
   export function any<S1 = unknown, S2 = S1, S3 = S2, S4 = S3, S5 = S4>(
      port1: Alt<S1>,
      port2: Alt<S2>,
      port3: Alt<S3>,
      port4: Alt<S4>,
      port5: Alt<S5>,
   ): AsyncAlt<S1 | S2 | S3 | S4 | S5>

   type NotFalse<T> = Exclude<T, false>
   // T extends false ? never : false extends T ? never : T

   export type RepeatFn = () => Promise<false | undefined>

   export type SeededRepeatFn<Seed = unknown> = (
      seed: NotFalse<Seed>,
   ) => Promise<NotFalse<Seed> | false>

   /**
    * I don't love while loops, so I use this instead.
    *
    * As a bonus, you can track state without mutations! Return a value other than false, and it will be available as the argument to your callback async function.
    * Pass in a seed value as the second argument to repeat.
    */
   export function repeat(func: RepeatFn): Promise<void>
   export function repeat<Seed = unknown>(
      func: SeededRepeatFn<Seed>,
      seed: Seed,
   ): Promise<void>

   /**
    * RepeatTakeFn are used as an argument to repeatTake, alongside a Chan that
    * provides its input.  Calling repeatTake() begins an asynchronous loop that
    * calls its RepeatTakeFn with values read from Chan provided as first argument.
    *
    * If a RepeatTakeFn returns nothing, loop continues with next value read from
    * Chan.  If RepeatTake returns false instead, asynchronous loop ends and Promise
    * returned to repeatTake()'s caller resolves.
    */
   export type RepeatTakeFn<Take = unknown> = (
      value: Take,
   ) => Promise<false | undefined>

   /**
    * SeededRepeatFn is like RepeatTakeFn except to continue the loop a value of
    */
   export type SeededRepeatTakeFn<Take = unknown, Seed = unknown> = (
      take: Take,
      seed: NotFalse<Seed>,
   ) => Promise<NotFalse<Seed> | false>

   /**
    * This is just like repeat above, except that before it repeats, it waits for a successful take on the given channel.
    * Then it passes this taken value in as the first argument, with any local state being passed as the second argument.
    *
    * See the ping/pong example above to see this in action.
    */
   export function repeatTake<T = unknown>(
      ch: Chan<T>,
      fn: RepeatTakeFn<T>,
   ): Promise<void>
   export function repeatTake<
      T = unknown,
      S extends Exclude<unknown, false> = unknown,
   >(ch: Chan<T>, fn: SeededRepeatTakeFn<T, S>, seed: S): Promise<void>

   /**
    * Creates a new channel that will receive all puts to the received channels.
    */
   export function merge<T1 = unknown, T2 = T1>(
      ch1: Chan<T1>,
      ch2: Chan<T2>,
   ): Chan<T1 | T2>
   export function merge<T1 = unknown, T2 = T1, T3 = T2>(
      ch1: Chan<T1>,
      ch2: Chan<T2>,
      ch3: Chan<T3>,
   ): Chan<T1 | T2 | T3>
   export function merge<T1 = unknown, T2 = T1, T3 = T2, T4 = T3>(
      ch1: Chan<T1>,
      ch2: Chan<T2>,
      ch3: Chan<T3>,
      ch4: Chan<T4>,
   ): Chan<T1 | T2 | T3 | T4>
   export function merge<T1 = unknown, T2 = T1, T3 = T2, T4 = T3, T5 = T4>(
      ch1: Chan<T1>,
      ch2: Chan<T2>,
      ch3: Chan<T3>,
      ch4: Chan<T4>,
      ch5: Array<Chan<T5>>,
   ): Chan<T1 | T2 | T3 | T4 | T5>
}
