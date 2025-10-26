// import "../../../extensions/kinds/ExtensionClassKind.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"
import { IHexSeed } from "../interface/IHexSeed.js"
import { IPhraseSeed } from "../interface/IPhraseSeed.js"

export {}

declare module "../../kinds/GenModelSeedModule.js" {
   interface GenModelExtensions {
      readonly HexSeed: HexSeedExtension
      readonly PhraseSeed: typeof PhraseSeedExtension
   }
}

// declare module "../../kinds/SeedModelKind.js" {
//    interface GenModelSeedURItoKind {
//       HexSeed: IHexSeed
//       PhraseSeed: IPhraseSeed
//    }
// }
