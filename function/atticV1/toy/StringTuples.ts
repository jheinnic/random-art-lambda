// export type StringUnionTuples<T extends string> = {
//    [K in T]: SolveTuple<T, K, [K]>
// }[T]

// type Remainder<T extends string, N extends T> = {
//    [K in T]: K extends N ? never : K
// }[T]

// type SolveTuple<T extends string, N extends T, R extends [...N[]]> = {
//    [K in T]: K extends Remainder<T, N>
//       ? SolveTuple<T, K | N, [K, ...R]>
//       : Remainder<T, N> extends never
//         ? R
//         : never
// }[T]

type HasDuplicates<
   T extends readonly unknown[],
   Seen extends readonly unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
   ? Head extends Seen[number]
      ? true // Found duplicate
      : HasDuplicates<Tail, [...Seen, Head]>
   : false

// Helper: Convert tuple to union
type TupleToUnion<T extends readonly unknown[]> = T[number]

// Helper: Check if two unions have the same members (bidirectional subset check)
type SameUnion<A, B> = [A] extends [B]
   ? [B] extends [A]
      ? true
      : false
   : false

/**
 * Main validation type - returns the input tuple if valid, never if invalid
 */
export type IsKeyTuple<T extends readonly string[], Obj> =
   // Check for duplicates
   HasDuplicates<T> extends true
      ? never
      : // Check if tuple union matches object keys union
        SameUnion<TupleToUnion<T>, StringKeys<Obj>> extends true
        ? T
        : never

// export type StringUnionTuples<T extends string> = {
//    [K in T]: SolveTuple<T, K, [K]>
// }[T]

// type Remainder<T extends string, N extends T> = {
//    [K in T]: K extends N ? never : K
// }[T]

// type SolveTuple<T extends string, N extends T, R extends [...N[]]> = {
//    [K in T]: K extends Remainder<T, N>
//       ? SolveTuple<T, K | N, [K, ...R]>
//       : Remainder<T, N> extends never
//         ? R
//         : never
// }[T]

type HasDuplicates<
   T extends readonly unknown[],
   Seen extends readonly unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
   ? Head extends Seen[number]
      ? true // Found duplicate
      : HasDuplicates<Tail, [...Seen, Head]>
   : false

// Helper: Convert tuple to union
type TupleToUnion<T extends readonly unknown[]> = T[number]

// Helper: Check if two unions have the same members (bidirectional subset check)
type SameUnion<A, B> = [A] extends [B]
   ? [B] extends [A]
      ? true
      : false
   : false

/**
 * Main validation type - returns the input tuple if valid, never if invalid
 */
export type IsKeyTuple<T extends readonly string[], Obj> =
   // Check for duplicates
   HasDuplicates<T> extends true
      ? never
      : // Check if tuple union matches object keys union
        SameUnion<TupleToUnion<T>, StringKeys<Obj>> extends true
        ? T
        : never
