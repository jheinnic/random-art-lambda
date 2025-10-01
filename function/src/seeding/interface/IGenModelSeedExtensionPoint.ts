import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { ReturnableSeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtensionPoint {
   toSeedModel: <
      ExtensionId extends string,
      M extends SeedTypeByExtension<ExtensionId>,
   >(
      input: M,
   ) => ReturnableSeedType
}
