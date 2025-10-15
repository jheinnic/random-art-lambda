import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { ReturnableSeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtensionPoint {
   validate: <ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
      input: SeedTypeByExtension<ExtensionId>,
   ) => void

   toSeedModel: <ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
      input: SeedTypeByExtension<ExtensionId>,
   ) => ReturnableSeedType
}
