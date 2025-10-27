// import "../../../extensions/kinds/ExtensionClassKind.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"

export {}

declare module "../../kinds/GenModelSeedModule.js" {
   abstract class GenModelExtensions {
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
