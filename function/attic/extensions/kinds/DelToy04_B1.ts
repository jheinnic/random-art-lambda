import "./DelToy01.js"
import { InnovationCatalogs, InnovatingIndustries } from "./DelToy04_B2.js"

declare module "./DelToy01.js" {
   export interface Catalog<_X extends string> {
      Innovating: {
         [INDIRECT]: InnovationCatalogs
      }
   }

   export interface Industry {
      Innovating: InnovatingIndustries
   }
}
