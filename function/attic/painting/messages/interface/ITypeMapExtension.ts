import { StringKeys } from "simplytyped"
import {
   FromTypeMapKind,
   KnownTypeMapExtensionIds,
   MapRuleNamesKind,
   ToTypeMapKind,
} from "../kinds/WireTxKind.js"
import { RuleNameIfMapped } from "./Translated.js"

export type Inferred<T> = T extends infer R ? R : never

export interface ITypeMapExtension<
   ExtensionId extends KnownTypeMapExtensionIds,
> {
   // encodeValue: <K extends StringKeys<FromTypeMapKind<ExtensionId>>>(
   //    ruleName: K,
   //    sourceValue: FromTypeMapKind<ExtensionId>[K],
   // ) => ToTypeMapKind<ExtensionId>[K]

   encodeValue: (
      ruleName: MapRuleNamesKind<ExtensionId>,
      sourceValue: FromTypeMapKind<ExtensionId>[typeof ruleName],
   ) => ToTypeMapKind<ExtensionId>[typeof ruleName]

   // decodeValue: <K extends StringKeys<FromTypeMapKind<ExtensionId>>>(
   //    ruleName: K,
   //    encodedValue: ToTypeMapKind<ExtensionId>[K],
   // ) => FromTypeMapKind<ExtensionId>[K]

   decodeValue: (
      ruleName: MapRuleNamesKind<ExtensionId>,
      encodedValue: ToTypeMapKind<ExtensionId>[typeof ruleName],
   ) => FromTypeMapKind<ExtensionId>[typeof ruleName]

   selectRule: (sourceValue: any) => MapRuleNamesKind<ExtensionId> | undefined
   // | RuleNameIfMapped<
   //      Inferred<typeof sourceValue>,
   //      FromTypeMapKind<ExtensionId>
   //   >

   // get getRuleNames(): MapRuleNamesKind<ExtensionId>
}
