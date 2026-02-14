import { PHRASE_SEED_EXTENSION_ID } from "../kinds/Constants.js"
import { SeedByExtension } from "../../models/SeedByExtension.js"

export interface IPhraseSeed extends SeedByExtension<PHRASE_SEED_EXTENSION_ID> {
   readonly seedKey: PHRASE_SEED_EXTENSION_ID
   phrase: string
}
