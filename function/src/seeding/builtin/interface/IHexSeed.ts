import { HEX_SEED_EXTENSION_ID } from "../kinds/Constants.js"
import { SeedByExtension } from "../../models/SeedByExtension.js"

export interface IHexSeed extends SeedByExtension<HEX_SEED_EXTENSION_ID> {
   readonly seedKey: HEX_SEED_EXTENSION_ID
   prefix: string
   suffix: string
}
