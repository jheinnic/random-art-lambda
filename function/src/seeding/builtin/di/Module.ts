import "../../../extensions/interface/IExtension.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"
import { IHexSeed } from "../interface/IHexSeed.js"
import { IPhraseSeed } from "../interface/IPhraseSeed.js"

export {}

declare module "../../../extensions/interface/IExtension.js" {
   interface ExtensionPayloadTypeURItoKind {
      readonly "GenModelSeedType/HexSeed": HexSeedExtension
      readonly "GenModelSeedType/PhraseSeed": PhraseSeedExtension
   }
   interface ExtensionTArgsURItoKind {
      readonly "GenModelSeedType/HexSeed": []
      readonly "GenModelSeedType/PhraseSeed": []
   }
}

declare module "../../interface/SeedModelKind.js" {
   interface SeedModelURItoKind {
      HexSeed: IHexSeed
      PhraseSeed: IPhraseSeed
   }
}
