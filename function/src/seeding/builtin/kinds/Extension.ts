import "../../kinds/GenModelSeedModule.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"

export {}

declare module "../../kinds/GenModelSeedModule.js" {
   interface ToGMSeedExtClassKind {
      readonly HexSeed: typeof HexSeedExtension
      readonly PhraseSeed: typeof PhraseSeedExtension
   }

   // interface ToGMSeedExtModelKind {
   //    readonly HexSeed: IHexSeed
   //    readonly PhraseSeed: IPhraseSeed
   // }
}

// declare module "../../kinds/SeedModelKind.js" {
//    interface GenModelSeedURItoKind {
//       HexSeed: IHexSeed
//       PhraseSeed: IPhraseSeed
//    }
// }
