import { Compo } from "./BaseCompo.js"
import * from "zod/v4/core"

declare module "./BaseCompo.js" {
   export interface Params {
      name?: string
   }

   export interface Compo {
      readonly name: string
   }
}

Object.defineProperty(Compo.prototype, "name", {
   get: function (this: Compo): string | undefined {
      return (this._params.name ?? "wee") + "poo"
   },
   set: undefined,
   enumerable: false,
   configurable: true,
})
