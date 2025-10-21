import { NamespaceURI } from "../../../extensions/interface/IExtensionPoint.js"

import {
   ExtensionPayloadTypeURIs,
   ExtensionPayloadTypeURItoKind,
   KnownPayloadIds,
} from "../../../extensions/interface/IExtension.js"

export const foo: KnownPayloadIds<"GenModelSeedType"> = "HexSeed"
export const fdo: KnownPayloadIds<"GenModelSeedType"> = "ui-component"
export const fko: KnownPayloadIds<"Examples"> = "ui-component"
export const fsko: KnownPayloadIds<"Examples"> = "HexSeed"
export const bar: KnownPayloadIds<"GenModelSeedType"> = "NOlkko"
export const baz: KnownPayloadIds<"FauxExtensionPoint"> = "GenericExtension"

export type Repeated<ExtensionPoint extends string> =
   keyof ExtensionPayloadTypeURItoKind<any> &
      NamespaceURI<ExtensionPoint, string>

export type KnownRepeated<ExtensionPoint extends string> =
   ExtensionPayloadTypeURIs<ExtensionPoint> extends NamespaceURI<
      ExtensionPoint,
      infer Id
   >
      ? string extends Id
         ? never
         : Id
      : never

export const afoo: KnownRepeated<"GenModelSeedType"> = "HexSeed"
export const abar: KnownRepeated<"GenModelSeedType"> = "NOlkko"
export const abaz: KnownRepeated<"FauxExtensionPoint"> = 4
