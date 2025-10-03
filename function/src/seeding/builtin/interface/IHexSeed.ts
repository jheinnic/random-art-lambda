import { HEX_SEED_EXTENSION_ID, HEX_SEED_EXTENSION_ID_STR } from "./Constants"
import { SeedTypeByExtension } from "../../interface/SeedTypeByExtension.js"

export interface IHexSeed extends SeedTypeByExtension<HEX_SEED_EXTENSION_ID> {
   readonly seedKey: HEX_SEED_EXTENSION_ID
   prefix: string
   suffix: string
}
