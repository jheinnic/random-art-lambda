import {
   CandidateGenModelSeedExtensionIds,
   GMSeedExtModelKind,
} from "../kinds/GenModelSeedKind.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGMSeedExtPayload<
   K extends CandidateGenModelSeedExtensionIds,
> {
   readonly extensionId: K
   validate: (input: SeedByExtension<string>) => input is GMSeedExtModelKind<K>

   toSeedModel: (input: GMSeedExtModelKind<K>) => PaintableSeed
}
