// import { KnownExtensionIds } from "../../extensions/kinds/ExtPointKind.js"
// import { GEN_MODEL_SEED_EXTENSION_POINT } from "../kinds/Constants.js"
import { SeedType } from "./SeedType.js"

export interface SeedByExtension<K extends string> extends SeedType<K> {
   // readonly seedKey: K
}

// K extends KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
// export type AnyExtensionSeed = SeedByExtension<
//    KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>
// >
