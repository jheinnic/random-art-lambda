import { Type } from "@nestjs/common"

export type IsModelExtension<
   Extension extends Type<any>,
   Model extends object,
> = keyof Extension extends {
   [K in keyof Extension]: [Extension[K]] extends [
      (this: Model, ...args: any[]) => any,
   ]
      ? K
      : never
}[keyof Extension]
   ? Extension
   : never
