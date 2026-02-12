import { ApplicableRules, TranslatedBy } from "./Translated.js"
import { KnownExtensionIds } from "../../extensions/kinds/ExtPointKind.js"
import { TYPE_MAP_EXTENSION_POINT } from "../kinds/Constants.js"
import { FromTypeMapKind, ToTypeMapKind } from "../kinds/WireTxKind.js"

export interface IWireCodecAdapter<
   ExtensionId extends KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
> {
   // From extends object,
   // To extends Record<StringKeys<From>, unknown>,
   encodeObject: <T extends object>(
      sourceObject: T,
   ) => TranslatedBy<
      T,
      FromTypeMapKind<ExtensionId>,
      ToTypeMapKind<ExtensionId>
   >

   decodeWireObject: <T extends object>(
      transformedObject: TranslatedBy<
         T,
         FromTypeMapKind<ExtensionId>,
         ToTypeMapKind<ExtensionId>
      >,
   ) => T
}
