import { Observable } from "rxjs"

import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"
import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./SeedTypeExtensionPoint"
import { SeedModelKind } from "./SeedModelKind.js"
import { SeedType } from "./SeedTypes.js"

export interface IGenModelSeedExtensionPoint {
   validate: <
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(
      extensionId: ExtensionId,
      input: SeedModelKind<ExtensionId>,
   ) => void

   toSeedModel: <
      ExtensionId extends
         KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>,
   >(
      extensionId: ExtensionId,
      input: SeedModelKind<ExtensionId>,
   ) => Observable<SeedType>
}
