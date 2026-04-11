// =============================================================================
// Type Utilities
// =============================================================================

/** Candidate is the literal type only if it is not already a key of Context. */
export type UnusedKey<
   Context extends object,
   Candidate extends string,
> = Candidate extends keyof Context ? never : Candidate

/** Candidate only if the two objects share no keys. */
export type CompatibleForMixin<
   Context extends object,
   Candidate extends object,
> = [keyof Context & keyof Candidate] extends [never] ? Candidate : never

/** Non-overlapping merge of two object types; never if they share a key. */
export type Mixin<Context extends object, Candidate extends object> = [
   keyof Context & keyof Candidate,
] extends [never]
   ? {
        [K in keyof Context | keyof Candidate]: K extends keyof Context
           ? Context[K]
           : K extends keyof Candidate
             ? Candidate[K]
             : never
     }
   : never

/** Add a single new property to an object type; never if the key is taken. */
export type WithProp<Context extends object, NewKey extends string, NewValue> =
   NewKey extends UnusedKey<Context, NewKey>
      ? {
           [K in NewKey | keyof Context]: K extends keyof Context
              ? Context[K]
              : NewValue
        }
      : never

/** Union of all [K, P] two-level path tuples reachable from Context. */
export type ContextKeyPairs<Context extends object> = {
   [K in keyof Context]: readonly [K, keyof Context[K]]
}[keyof Context]

/** Union of all valid single-key or two-level path selectors for Context. */
export type ContextKeysAndPairs<Context extends object> = {
   [K in keyof Context]: K | readonly [K, keyof Context[K]]
}[keyof Context]
// export type ContextKeysAndPairs<Context extends object> =
//    | keyof Context
//    | ContextKeyPairs<Context>

/** Map an array of selectors to the tuple of value types they resolve to. */
// export type aCallableParams<
//    Context extends object,
//    ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
// > = {
//    [N in keyof ParamSelectors]: ParamSelectors[N] extends ContextKeyPairs<Context>
//       ? Context[ParamSelectors[N][0]][ParamSelectors[N][1]]
//       : ParamSelectors[N] extends keyof Context
//         ? Context[ParamSelectors[N]]
//         : never
// }

export type CallableParams<
   Context extends object,
   ParamSelectors extends ReadonlyArray<ContextKeysAndPairs<Context>>,
> = {
   [N in keyof ParamSelectors]: ParamSelectors[N] extends keyof Context
      ? Context[ParamSelectors[N]]
      : ParamSelectors[N] extends ContextKeyPairs<Context>
        ? Context[ParamSelectors[N][0]][ParamSelectors[N][1]]
        : never
}

// =============================================================================
// Codec-compliance helper
// =============================================================================

// type AtomicData = string | number | boolean

// /** Compile-time check that T contains only serializable data (no functions). */
// export type ValidateJustData<T> = T extends AtomicData
//    ? T
//    : T extends Array<infer U>
//      ? U extends ValidateJustData<U>
//         ? T
//         : never
//      : T extends (...args: never[]) => unknown
//        ? never
//        : T extends { [K in keyof T]: ValidateJustData<T[K]> }
//          ? T
//          : never
