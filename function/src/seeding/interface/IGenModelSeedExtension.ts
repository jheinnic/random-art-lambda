import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./SeedTypeExtensionPoint"
import { SeedModelKind } from "./SeedModelKind.js"
import { ReturnableSeedType } from "./SeedTypes.js"
import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"

export interface IGenModelSeedExtension<
   ExtensionId extends KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
> {
   validate: (input: SeedModelKind<ExtensionId>) => void

   toSeedModel: (input: SeedModelKind<ExtensionId>) => ReturnableSeedType
}
