import { KnownExtensionClassIds } from "../../extensions/kinds/ExtensionClassKind.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "../kinds/Constants.js"
import { SeedType } from "./SeedType.js"

export interface SeedByExtension<
   // K extends KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>,
   K extends string,
> extends SeedType {
   readonly seedKey: K
}

export type AnyExtensionSeed = SeedByExtension<
   KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>
>
