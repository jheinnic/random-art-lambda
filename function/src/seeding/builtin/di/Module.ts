// import { NamespaceURI } from "../../../extensions/interface/IExtensionPoint.js"
import { HexSeedExtension } from "../components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../components/PhraseSeedExtension.js"

// import {
//    ExtensionPayloadTypeURIs,
//    ExtensionPayloadTypeURItoKind,
//    KnownPayloadIds,
// } from "../../../extensions/interface/IExtension.js"

declare module "../../../extensions/interface/IExtension.js" {
   interface ExtensionPayloadTypeURITo<K extends string> {
      readonly "GenModelSeedType/HexSeed": HexSeedExtension
      readonly "GenModelSeedType/PhraseSeed": PhraseSeedExtension
   }
   interface ExtensionTArgsURITo {
      readonly "GenModelSeedType/HexSeed": []
      readonly "GenModelSeedType/PhraseSeed": []
      readonly "GenModelSeedType/PaseSeed": []
   }
}

// export const foo: KnownPayloadIds<"GenModelSeedType"> = "HexSeed"
// export const bar: KnownPayloadIds<"GenModelSeedType"> = "NOlkko"
// export const baz: KnownPayloadIds<"FauxExtensionPoint"> = "NOlkko"

// export type k = ExtensionPayloadTypeURIs
// export const qw: k = "giraffe"
// export const qaw: k = "GenModelSeedType/HexSeed"
// export const qrw: k = "FauxExtensionPoint/BasicExtension"

// export type Repeated = keyof ExtensionPayloadTypeURItoKind<any> &
//    NamespaceURI<string, string>

// export type KnownRepeated<ExtensionPoint extends string> =
//    Repeated extends NamespaceURI<infer Ep, infer Id>
//       ? Ep extends ExtensionPoint
//          ? Id
//          : never
//       : never

// export const afoo: KnownRepeated<"GenModelSeedType"> = "HexSeed"
// export const abar: KnownRepeated<"GenModelSeedType"> = "NOlkko"
// export const abaz: KnownRepeated<"FauxExtensionPoint"> = "NOlkko"
