// import "../../../extensions/kinds/ExtensionClassKind.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"
import { IHexSeed } from "../interface/IHexSeed.js"
import { IPhraseSeed } from "../interface/IPhraseSeed.js"

export {}

declare module "../../../extensions/kinds/ExtensionClassKind.js" {
   interface ExtensionPayloadTypeURItoKind {
      readonly "GenModelSeed/HexSeed": HexSeedExtension
      readonly "GenModelSeed/PhraseSeed": PhraseSeedExtension
   }
   interface ExtensionTArgsURItoKind {
      readonly "GenModelSeed/HexSeed": []
      readonly "GenModelSeed/PhraseSeed": []
   }
}

declare module "../../kinds/SeedModelKind.js" {
   interface GenModelSeedURItoKind {
      HexSeed: IHexSeed
      PhraseSeed: IPhraseSeed
   }
}
