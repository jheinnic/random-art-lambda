import "./DelToy04_A2.js"
import { StandardBlenders, StandardNotebooks } from "./DelToy05_A1.js"

declare module "./DelToy04_A2.js" {
   export interface ConformingIndustries {
      Notebook: typeof StandardNotebooks
      Blender: typeof StandardBlenders
   }
}
