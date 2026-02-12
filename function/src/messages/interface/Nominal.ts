const NOMINAL_NAME: unique symbol = Symbol("Nominal")

export type Nominal<Type, Discriminant extends symbol> = Type & {
   readonly [K in Discriminant]: typeof NOMINAL_NAME
}
