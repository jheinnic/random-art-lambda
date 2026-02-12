import { KnownGenModelSeedExtensionIds } from "../kinds/GenModelSeedKind.js"
import { Observable } from "rxjs"

import { GEN_MODEL_SEED_EXTENSION_POINT } from "../kinds/Constants.js"

import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

import { IExtensionPoint } from "../../../extensions/interface/index.js"

export interface IGMSeedExtensionPoint
   extends IExtensionPoint<GEN_MODEL_SEED_EXTENSION_POINT> {
   toSeedModel: (
      input: SeedByExtension<KnownGenModelSeedExtensionIds> | PaintableSeed,
   ) => PaintableSeed
}
