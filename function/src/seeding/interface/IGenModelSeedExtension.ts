import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./SeedTypeExtensionPoint"
import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"
import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { ReturnableSeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtension<
   ExtensionId extends KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
> {
   validate: <Model extends SeedTypeByExtension<ExtensionId>>(
      input: Model,
   ) => void

   toSeedModel: <Model extends SeedTypeByExtension<ExtensionId>>(
      input: Model,
   ) => ReturnableSeedType
}
