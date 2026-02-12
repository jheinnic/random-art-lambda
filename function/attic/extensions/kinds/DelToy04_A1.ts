import "./DelToy01.js"
import { Commodity } from "./DelToy03.js"
import { ConformingIndustries } from "./DelToy04_A2.js"

declare module "./DelToy01.js" {
   export interface Catalog<_X extends string> {
      Conforming: Commodity<_X>
   }

   export interface Industry {
      Conforming: ConformingIndustries
   }
}
