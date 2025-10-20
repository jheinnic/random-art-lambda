import "../../../extensions/interface/IExtension.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"

export {}

declare module "../../../extensions/interface/IExtension.js" {
   interface ExtensionPayloadTypeURIToKind<K extends string> {
      readonly "GenModelSeedType/HexSeed": HexSeedExtension
      readonly "GenModelSeedType/PhraseSeed": PhraseSeedExtension
   }
   interface ExtensionTArgsURIToKind {
      readonly "GenModelSeedType/HexSeed": []
      readonly "GenModelSeedType/PhraseSeed": []
      readonly "GenModelSeedType/PaseSeed": []
   }
}
