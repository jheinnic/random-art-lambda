import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { ReturnableSeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtension<
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> {
   validate: (
      // input: Model,
      input: SeedTypeByExtension<ExtensionId>,
   ) => void

   toSeedModel: (
      // input: Model,
      input: SeedTypeByExtension<ExtensionId>,
   ) => ReturnableSeedType
}
