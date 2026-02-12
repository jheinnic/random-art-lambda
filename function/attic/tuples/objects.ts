import { NoDistribute } from "simplytyped"

// Part 1: Get the number of keys in an object export type T
// export type LengthOfKeys<T> = [keyof T] extends [infer K]
//    ? K[]["length"]
//    : never
export type LengthOfKeys<T> = keyof T extends infer K & {}
   ? K & {} extends K
      ? K[]["length"]
      : never
   : never
export type Len<T> = Array<NoDistribute<keyof T>>

// Part 2: Check if a tuple K has all the keys from object T
export type HasAllKeys<T, K extends Array<keyof T>> = {
   [P in keyof T]: P extends K[number] ? true : false
}[keyof T] extends true
   ? true
   : false

// Part 3: Combine checks into the final validation export type
export type IsValidKeyTuple<T, K extends Array<keyof T>> =
   K["length"] extends LengthOfKeys<T>
      ? HasAllKeys<T, K> extends true
         ? true
         : false
      : false

export type ValidKeyTuple<T, K extends Array<keyof T>> =
   IsValidKeyTuple<T, K> extends true ? K : never

export type KeyTupleTypes<T, K extends Array<keyof T>> = {
   [P in keyof K]: T[K[P]] extends infer R ? R : never
} & any[]
