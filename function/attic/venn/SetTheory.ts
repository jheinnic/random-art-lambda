const IS_IN_SYM: unique symbol = Symbol("IS_IN")
const IS_OUT_SYM: unique symbol = Symbol("IS_OUT")

type IS_IN = typeof IS_IN_SYM
type IS_OUT = typeof IS_OUT_SYM

export type NominalVennIn<
   BaseType,
   KnownSet extends symbol,
   IsIn extends KnownSet,
   IsOut extends Exclude<KnownSet, IsIn>,
> = BaseType & {
   readonly [K in KnownSet]: K extends IsIn
      ? IS_IN
      : K extends IsOut
        ? IS_OUT
        : IS_IN | IS_OUT
}

export type NominalVennOut<
   BaseType,
   KnownSet extends symbol,
   IsOut extends KnownSet,
   IsIn extends Exclude<KnownSet, IsOut>,
> = BaseType & {
   readonly [K in KnownSet]: K extends IsOut
      ? IS_OUT
      : K extends IsIn
        ? IS_IN
        : IS_IN | IS_OUT
}

export type VennJust<
   BaseType,
   KnownSet extends symbol,
   Include extends KnownSet,
> = NominalVennIn<BaseType, KnownSet, Include, never>

export type VennNot<
   BaseType,
   KnownSet extends symbol,
   Except extends KnownSet,
> = NominalVennOut<BaseType, KnownSet, Except, never>

export type VennUnknown<BaseType, KnownSet extends symbol> = NominalVennOut<
   BaseType,
   KnownSet,
   KnownSet,
   never
>

export type VennAnyKnown<BaseType, KnownSet extends symbol> = BaseType &
   {
      [K in KnownSet]: {
         readonly [P in KnownSet]: P extends K ? IS_IN : IS_IN | IS_OUT
      }
   }[KnownSet]

export type VennUniverse<BaseType, KnownSet extends symbol> = BaseType & {
   readonly [K in KnownSet]: IS_IN | IS_OUT
}

export type VennEmptySet<BaseType, KnownSet extends symbol> = BaseType & {
   readonly [K in KnownSet]: never
}

export type VennDimension<
   BaseType,
   KnownSet extends symbol,
   Dimension extends KnownSet,
   Mutex extends Dimension,
> = BaseType &
   {
      [K in Dimension]: {
         readonly [P in KnownSet]: P extends K
            ? IS_IN
            : P extends Dimension
              ? IS_OUT
              : IS_IN | IS_OUT
      }
   }[Mutex]

export type VennAntiDimension<
   BaseType,
   KnownSet extends symbol,
   Dimension extends KnownSet,
   Mutex extends Dimension,
> = BaseType &
   {
      [K in Dimension]: {
         readonly [P in KnownSet]: P extends K
            ? IS_IN
            : P extends Dimension
              ? IS_OUT
              : IS_IN | IS_OUT
      }
   }[Exclude<Dimension, Mutex>]
