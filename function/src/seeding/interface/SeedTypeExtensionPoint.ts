import { IExtensionClass } from "../../extensions/interface/IExtension.js"
import { IGenModelSeedExtension } from "./IGenModelSeedExtension.js"

export const GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING = "GenModelSeedType" // "GenModelSeedType" =
export type GEN_MODEL_SEED_TYPE_EXTENSION_POINT =
   typeof GEN_MODEL_SEED_TYPE_EXTENSION_POINT_STRING

// This type locks the ExtensionPoint AND the Instance type
export type GenModelSeedClass<ExtensionId extends string> = IExtensionClass<
   GEN_MODEL_SEED_TYPE_EXTENSION_POINT,
   ExtensionId,
   IGenModelSeedExtension<ExtensionId>,
   []
>
