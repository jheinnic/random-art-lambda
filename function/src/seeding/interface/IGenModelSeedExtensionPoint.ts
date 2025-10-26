import { KnownGenModelSeedExtensionIds } from "./../kinds/GenModelSeedExtensionKind"
import { Observable } from "rxjs"

import { PaintableSeed } from "../models/PaintableSeed.js"
import { SeedByExtension } from "../models/SeedByExtension.js"

export interface IGenModelSeedExtensionPoint {
   toSeedModel: ((
      extensionId: KnownGenModelSeedExtensionIds,
      input: SeedByExtension<typeof extensionId>,
   ) => Observable<PaintableSeed>) &
      ((
         extensionId: PaintableSeed["seedKey"],
         input: PaintableSeed,
      ) => Observable<PaintableSeed>)
}
