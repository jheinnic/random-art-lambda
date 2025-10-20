import { PHRASE_SEED_EXTENSION_ID } from "./Constants"
import { SeedTypeByExtension } from "../../interface/SeedTypeByExtension.js"

export interface IPhraseSeed
   extends SeedTypeByExtension<PHRASE_SEED_EXTENSION_ID> {
   readonly seedKey: PHRASE_SEED_EXTENSION_ID
   phrase: string
}
