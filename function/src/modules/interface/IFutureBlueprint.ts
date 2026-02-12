import { StringKeys } from "simplytyped"
import { ModuleDependenciesOption } from "./IInjectableModuleClassFactory.js"

export type TokenTypes<T> = {
   [K in Extract<keyof T, symbol>]: T[K]
}

export type SomeBuilder<T> = {
   [K in StringKeys<T>]: T[K] extends (...args: infer P) => any
      ? (...args: P) => SomeBuilder<ReturnType<T[K]>>
      : never
}

export type SomeBlueprint<
   Build extends string,
   Injection extends TokenTypes<Injection>,
   T,
> = {
   [K in Exclude<StringKeys<T>, Build>]: T[K] extends (
      ...args: AllowedBlueprintParams<infer P, Injection>
   ) => any
      ? (...args: P) => SomeBlueprint<Build, Injection, ReturnType<T[K]>>
      : never
} & { [K in Build]: () => any }

type ExternalizeParams<
   Params extends readonly any[],
   Injection extends TokenTypes<Injection>,
> = {
   [P in keyof Params]: Params[P] extends keyof Injection
      ? ModuleDependenciesOption
      : Params[P]
}

export type ExternalizedBuilder<
   Builder extends SomeBuilder<Builder>,
   Injection extends TokenTypes<Injection>,
> = {
   [K in StringKeys<Builder>]: (
      ...args: ExternalizeParams<Parameters<Builder[K]>, Injection>
   ) => ExternalizedBuilder<ReturnType<Builder[K]>, Injection>
}

export type ExternalizedBlueprint<
   Build extends string,
   Injection extends TokenTypes<Injection>,
   Blueprint extends SomeBlueprint<Build, Injection, Blueprint>,
   Config extends object = {},
   Tokens extends object = {},
> = {
   [K in Exclude<StringKeys<Blueprint>, Build>]: (
      ...args: ExternalizeParams<Parameters<Blueprint[K]>, Injection>
   ) => ExternalizedBlueprint<
      Build,
      Injection,
      ReturnType<Blueprint[K]>,
      ExpandConfig<Config, K, Injection, Parameters<Blueprint[K]>>,
      ExpandTokens<Tokens, K, Injection, Parameters<Blueprint[K]>>
   >
}

export type ConfigContract<
   Build extends string,
   Injection extends TokenTypes<Injection>,
   Blueprint extends SomeBlueprint<Build, Injection, Blueprint>,
   Externalized extends ExternalizedBlueprint<Build, Injection, Blueprint>,
> =
   Externalized extends ExternalizedBlueprint<
      Build,
      Injection,
      Blueprint,
      infer Config
   >
      ? StripUndefined<Config>
      : never

export type TokensContract<
   Build extends string,
   Injection extends TokenTypes<Injection>,
   Blueprint extends SomeBlueprint<Build, Injection, Blueprint>,
   Externalized extends ExternalizedBlueprint<Build, Injection, Blueprint>,
> =
   Externalized extends ExternalizedBlueprint<
      Build,
      Injection,
      Blueprint,
      infer _Config,
      infer Tokens
   >
      ? StripUndefined<Tokens>
      : never

type StripUndefined<T extends object> = {
   [K in {
      [K2 in keyof T]: T[K2] extends undefined ? never : K2
   }[keyof T]]: T[K]
}

type OnlyValues<T, Injection extends TokenTypes<Injection>> = T extends object
   ? T extends {
        [K in keyof T]: T[K] extends keyof Injection ? never : T[K]
     }
      ? T
      : never
   : T extends keyof Injection
     ? never
     : T

type OnlyToken<
   T,
   Injection extends TokenTypes<Injection>,
> = T extends keyof Injection ? T : never

type AllowedBlueprintParams<
   Params extends readonly any[],
   Injection extends TokenTypes<Injection>,
> = Params extends [OnlyToken<Params[0], Injection>]
   ? Params
   : Params extends [OnlyValues<Params[0], Injection>]
     ? Params
     : Params extends [
            OnlyToken<Params[0], Injection>,
            OnlyValues<Params[1], Injection>,
         ]
       ? Params
       : Params extends [
              OnlyValues<Params[0], Injection>,
              OnlyToken<Params[1], Injection>,
           ]
         ? Params
         : never

type JustTheValue<
   Injection extends TokenTypes<Injection>,
   Params extends readonly any[],
> =
   Params extends AllowedBlueprintParams<Params, Injection>
      ? Params[0] extends OnlyValues<Params[0], Injection>
         ? Params[0]
         : Params[1]
      : never

type JustTheToken<
   Injection extends TokenTypes<Injection>,
   Params extends readonly any[],
> =
   Params extends AllowedBlueprintParams<Params, Injection>
      ? Params[0] extends OnlyToken<Params[0], Injection>
         ? Params[0]
         : Params[1]
      : never

type ExpandConfig<
   Config,
   K extends string,
   Injection extends TokenTypes<Injection>,
   Params extends readonly any[],
> = Config & { [Key in K]: JustTheValue<Injection, Params> }

type ExpandTokens<
   Config,
   K extends string,
   Injection extends TokenTypes<Injection>,
   Params extends readonly any[],
> = Config & { [Key in K]: JustTheToken<Injection, Params> }

interface Demo {
   doo: (k: string) => Demo
   moo: (k: string) => Demo
   soo: (a: number, b: typeof BB) => Demo
   foo: (a: typeof AA, b: string) => Demo
   noo: (a: typeof AA) => Demo
   build: () => any
}

const AA: unique symbol = Symbol("aa")
const BB: unique symbol = Symbol("bb")

interface DemoTypes {
   [AA]: string
   [BB]: number
}

type KAJ = ExternalizedBlueprint<"build", DemoTypes, Demo>
const jfs: KAJ = {} as unknown as KAJ

const host = jfs
   .soo(82, { use: "value", value: 18 })
   .doo("cabin")
   .noo({ use: "value", value: "truish" })

type A11 = ConfigContract<"build", DemoTypes, Demo, typeof host>
type B11 = TokensContract<"build", DemoTypes, Demo, typeof host>
