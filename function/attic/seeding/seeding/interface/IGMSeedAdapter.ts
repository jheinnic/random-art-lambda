import { KnownGenModelSeedExtensionIds } from "../kinds/GenModelSeedKind.js"
import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGMSeedAdapter<
   ExtensionId extends KnownGenModelSeedExtensionIds,
> {
   toPaintable: (seed: SeedByExtension<ExtensionId>) => PaintableSeed
}
