import {
   KnownGenModelSeedURIs,
   GenModelSeedKind,
} from "../kinds/SeedModelKind.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGenModelSeedExtension<K extends KnownGenModelSeedURIs> {
   validate: (
      input: SeedByExtension<KnownGenModelSeedURIs>,
   ) => input is GenModelSeedKind<K>

   toSeedModel: (input: SeedByExtension<KnownGenModelSeedURIs>) => PaintableSeed
}
