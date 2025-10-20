import { SeedTypeByExtension } from "./SeedTypeByExtension.js"
import { ReturnableSeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtension<
   ExtensionId extends string,
   Model extends SeedTypeByExtension<ExtensionId>,
> {
   validate: (input: Model) => void

   toSeedModel: (input: Model) => ReturnableSeedType
}
