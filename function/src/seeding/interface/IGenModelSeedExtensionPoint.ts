import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./SeedTypeExtensionPoint"
import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"
import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { ReturnableSeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtensionPoint {
   validate: <
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(
      extensionId: ExtensionId,
      input: SeedTypeByExtension<ExtensionId>,
   ) => void

   toSeedModel: <
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(
      extensionId: ExtensionId,
      input: SeedTypeByExtension<ExtensionId>,
   ) => ReturnableSeedType
}
