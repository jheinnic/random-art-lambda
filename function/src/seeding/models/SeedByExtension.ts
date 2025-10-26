import { KnownExtensionIds } from "../../extensions/kinds/ExtensionKind.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "../kinds/Constants.js"
import { SeedType } from "./SeedType.js"

export interface SeedByExtension<
   // K extends KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
   K extends string,
> extends SeedType {
   readonly seedKey: K
}

export type AnyExtensionSeed = SeedByExtension<
   KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>
>
