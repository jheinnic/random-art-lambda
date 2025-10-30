import { GenModelSeedKind } from "../kinds/GenModelSeedKind.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGenModelSeedExtension<K extends string> {
   validate: (input: SeedByExtension<string>) => input is GenModelSeedKind<K>

   toSeedModel: (input: SeedByExtension<K>) => PaintableSeed
}
