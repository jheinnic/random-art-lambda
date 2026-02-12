import "./DelToy04_B2.js"
import { AutoPart, BakedGood } from "./DelToy03.js"
import { BakeryCatalog, DealerCatalog } from "./DelToy05_B1.js"

declare module "./DelToy04_B2.js" {
   export interface InnovationCatalogs {
      BakedGoods: BakedGood
      AutoParts: AutoPart
   }

   export interface InnovatingIndustries {
      BakedGoods: typeof BakeryCatalog
      AutoParts: typeof DealerCatalog
   }
}
