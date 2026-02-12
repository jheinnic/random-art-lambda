import { StringKeys } from "simplytyped"
import { AssertEqual, AssertExtends } from "zod/v4/core/util.cjs"

export type HasDistinctValues<T extends object> = AssertEqual<
   never,
   {
      [K in StringKeys<T>]: Extract<ValuesExceptFor<T, K>, T[K]>
   }[StringKeys<T>]
>

type ValuesExceptFor<T extends object, ExcludedKey extends StringKeys<T>> = {
   [K in Exclude<StringKeys<T>, ExcludedKey>]: T[K]
}[Exclude<StringKeys<T>, ExcludedKey>]

export type RuleNameIfMapped<T, M extends object> = {
   [K in StringKeys<M>]: AssertEqual<AssertExtends<T, M[K]>, T> extends true
      ? K
      : never
}[StringKeys<M>]

export type RuleNameIfDefined<T, M extends object> = IfNever<
   RuleNameIfMapped<T, M>
>
type IfNever<T> = [T] extends [never] ? undefined : T

// export type MappedPropertiesOf<T extends object, M extends object> = {
//    [K in StringKeys<T>]: AssertNotEqual<
//       RuleNameIfMapped<T[K], M>,
//       never
//    > extends true
//       ? K
//       : never
// }[StringKeys<T>]

export type ApplicableRules<T extends object, M extends object> = {
   [K in StringKeys<T>]: RuleNameIfDefined<T[K], M>
}

export type TranslatedBy<
   T extends object,
   From extends object,
   To extends Record<StringKeys<From>, unknown>,
> =
   HasDistinctValues<From> extends true
      ? {
           [K in StringKeys<T>]: AssertEqual<
              RuleNameIfMapped<T[K], From>,
              never
           > extends false
              ? To[RuleNameIfMapped<T[K], From>] extends infer R
                 ? { [".tx.rule"]: RuleNameIfMapped<T[K], From>; content: R }
                 : never
              : T[K]
        }
      : never

export type CoverMapRulesTuple<
   From extends object,
   Rules extends ReadonlyArray<StringKeys<From>>,
> =
   AssertEqual<Exclude<StringKeys<From>, Rules[number]>, never> extends true
      ? Rules
      : never
