import { Type } from "@nestjs/common"
import { IsModelExtension } from "./IsModelExtension.js"

export type DelegateForExtension<
   Extension extends Type<any>,
   Base extends object,
> =
   Extension extends IsModelExtension<Extension, Base>
      ? {
           [K in keyof Extension]: [Extension[K]] extends [
              (this: any, ...args: infer P) => infer R,
           ]
              ? (...args: P) => R
              : never
        } & Base
      : never

type IsModelExtensionDelegated<
   Extension extends Type<any>,
   Base extends object,
   Delegate extends DelegateForExtension<Extension, Base>,
> = Extension extends IsModelExtension<Extension, Delegate> ? Extension : never

interface CoreModel {
   name: string
}

interface OokYookExtension {
   new (): this
   watchIt: (this: CoreModel, name: string) => number
}

export interface Hiya extends OokYook {}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class OokYook {
   private constructor() {}
   static watchIt(
      this: DelegateForExtension<OokYookExtension, CoreModel>,
      name: string,
   ): number {
      return name.length
   }

   static wearIt(
      this: DelegateForExtension<OokYookExtension, CoreModel>,
      name: number,
   ): string {
      const value = name * this.watchIt("name")
      return value.toString(8)
   }
}

abstract class Giggle<
   I,
   CoreModel extends object,
   X extends Type<any>,
   Y extends IsModelExtension<X, CoreModel>,
> implements Y {}
