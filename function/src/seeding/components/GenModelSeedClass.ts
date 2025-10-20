import {
   IExtensionClass,
   KnownExtensionIds,
} from "../../extensions/interface/IExtension.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "../interface/SeedTypeExtensionPoint.js"

// This type locks the ExtensionPoint AND the Instance type
export type GenModelSeedClass<
   ExtensionId extends KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
> = IExtensionClass<GEN_MODEL_SEED_TYPE_EXTENSION_POINT, ExtensionId>
