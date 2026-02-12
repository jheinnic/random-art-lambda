import { StringKeys } from "simplytyped"
import {
   HookForMapFromTypes,
   HookForMapRuleNames,
   HookForMapToTypes,
   HookForTypeMapExtensions,
} from "./WireTxHooks.js"
import {
   CoverMapRulesTuple,
   HasDistinctValues,
} from "../interface/Translated.js"
import { AssertEqual } from "zod/v4/core/util.cjs"
export type CandidateTypeMapExtensionIds = StringKeys<HookForTypeMapExtensions>
// CandidateExtensionIds<TYPE_MAP_EXTENSION_POINT> &
// StringKeys<HookForMapRuleNames> &
// StringKeys<HookForMapFromTypes> &
// StringKeys<HookForMapToTypes>

export type ExtensionValidityTest<
   ExtensionId extends CandidateTypeMapExtensionIds,
> =
   HasDistinctValues<HookForMapFromTypes[ExtensionId]> extends true
      ? // ? AssertEqual<
        //      StringKeys<HookForMapFromTypes[ExtensionId]>,
        //      StringKeys<HookForMapToTypes[ExtensionId]>
        //   > extends true
        //   AssertEqual<
        //      CoverMapRulesTuple<
        //         HookForMapFromTypes[ExtensionId],
        //         MapRuleNamesKind<ExtensionId>
        //      >,
        //      never
        //   > extends false
        ExtensionId
      : never
// : never
// : never

export type KnownTypeMapExtensionIds = {
   [ExtensionId in CandidateTypeMapExtensionIds]: ExtensionValidityTest<ExtensionId>
}[CandidateTypeMapExtensionIds]

export type FromTypeMapKind<ExtensionId extends CandidateTypeMapExtensionIds> =
   HookForMapFromTypes[ExtensionId] & object

export type ToTypeMapKind<ExtensionId extends CandidateTypeMapExtensionIds> =
   HookForMapToTypes[ExtensionId] &
      Record<StringKeys<FromTypeMapKind<ExtensionId>>, unknown>

export type MapRuleNamesKind<ExtensionId extends CandidateTypeMapExtensionIds> =
   StringKeys<HookForMapFromTypes[ExtensionId]> &
      StringKeys<HookForMapToTypes[ExtensionId]>

export type KnownTypeMapExtensions = {
   [ExtensionId in KnownTypeMapExtensionIds]: HookForTypeMapExtensions[ExtensionId]
}
