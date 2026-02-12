import { KnownExtensionIds } from "../../extensions/kinds/ExtPointKind.js"
import { TYPE_MAP_EXTENSION_POINT } from "../kinds/Constants.js"
import { FromTypeMapKind, ToTypeMapKind } from "../kinds/WireTxKind.js"
import { TranslatedBy, ApplicableRules } from "./Translated.js"

export type WireForm<
   T extends object,
   ExtensionId extends KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
> = TranslatedBy<T, FromTypeMapKind<ExtensionId>, ToTypeMapKind<ExtensionId>>

export interface ITypeMapExtensionPoint {
   encodeObject: <T extends object>(
      sourceObject: T,
      extensionId: KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
   ) => WireForm<T, typeof extensionId>

   decodeWireObject: <T extends object>(
      transformedObject: WireForm<T, typeof extensionId>,
      extensionId: KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
   ) => T
}
