import "./Module.js"
import { NamespaceURI } from "../../../extensions/interface/IExtensionPoint.js"

import {
   ExtensionPayloadTypeURIs,
   ExtensionPayloadTypeURItoKind,
   KnownPayloadIds,
} from "../../../extensions/interface/IExtension.js"

export const foo: KnownPayloadIds<"GenModelSeedType"> = "HexSeed"
export const bar: KnownPayloadIds<"GenModelSeedType"> = "NOlkko"
export const baz: KnownPayloadIds<"FauxExtensionPoint"> = "GenericExtension"

export type k = ExtensionPayloadTypeURIs
export const qw: k = "giraffe"
export const qaw: k = "GenModelSeedType/HexSeed"
export const qrw: k = "FauxExtensionPoint/GenericExtension"

export type Repeated = keyof ExtensionPayloadTypeURItoKind<any> &
   NamespaceURI<string, string>

export type KnownRepeated<ExtensionPoint extends string> =
   Repeated extends NamespaceURI<infer Ep, infer Id>
      ? Ep extends ExtensionPoint
         ? Id
         : never
      : never

export const afoo: KnownRepeated<"GenModelSeedType"> = "HexSeed"
export const abar: KnownRepeated<"GenModelSeedType"> = "NOlkko"
export const abaz: KnownRepeated<"FauxExtensionPoint"> = "NOlkko"
