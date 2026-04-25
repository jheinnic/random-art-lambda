export type ExpressionVisibility = "hidden" | "mandatory" | "optional"

export type VisibleProps<
   V extends ExpressionVisibility,
   Key extends string,
   T,
> = V extends "hidden"
   ? object
   : V extends "mandatory"
     ? { readonly [K in Key]: T }
     : { readonly [K in Key]?: T }

type HasUndef<T extends object> = {
   [K in keyof T]: [undefined] extends [T[K]] ? K : never
}[keyof T]

type LacksUndef<T extends object> = Exclude<keyof T, HasUndef<T>>

export type Quick<T extends object> = {
   -readonly [K in HasUndef<T>]+?: NonNullable<T[K]>
} & {
   -readonly [K in LacksUndef<T>]-?: NonNullable<T[K]>
}

type Quod = Quick<
   { i: undefined } & VisibleProps<"hidden", "b" | "q", number> &
      VisibleProps<"mandatory", "c", string> &
      VisibleProps<"mandatory", "a" | "f" | "h", number> & {}
> &
   VisibleProps<"optional", "d" | "e" | "g", string>

export const k: Quod = { c: "lkoi" }
const o: Quod = {
   a: 4,
   c: "ddd",
   f: 3,
   h: 9,
}

o.a = 5
o.e = 5
