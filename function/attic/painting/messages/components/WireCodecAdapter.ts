import { objectKeys, StringKeys } from "simplytyped"
import { KnownExtensionIds } from "../../extensions/kinds/ExtPointKind.js"
import { ITypeMapExtension } from "../interface/ITypeMapExtension.js"
import { IWireCodecAdapter } from "../interface/IWireCodecAdapter.js"
import { TranslatedBy } from "../interface/Translated.js"
import { TYPE_MAP_EXTENSION_POINT } from "../kinds/Constants.js"
import {
   FromTypeMapKind,
   MapRuleNamesKind,
   ToTypeMapKind,
} from "../kinds/WireTxKind.js"

export class WireCodecAdapter<
   ExtensionId extends KnownExtensionIds<TYPE_MAP_EXTENSION_POINT>,
> implements IWireCodecAdapter<ExtensionId>
{
   constructor(
      private readonly extensionId: ExtensionId,
      private readonly extension: ITypeMapExtension<ExtensionId>,
   ) {}

   encodeObject<T extends object>(
      _sourceObject: T,
   ): TranslatedBy<
      T,
      FromTypeMapKind<ExtensionId>,
      ToTypeMapKind<ExtensionId>
   > {
      const newObjectEntries = objectKeys(_sourceObject)
         .filter((key: keyof T): boolean => {
            return typeof key === "string"
         })
         .map((key: keyof T): StringKeys<T> => {
            return key as StringKeys<T>
         })
         .map((key: StringKeys<T>): [typeof key, unknown] => {
            const rule = this.extension.selectRule(_sourceObject[key])
            if (rule !== undefined) {
               const sourceValue = _sourceObject[
                  key
               ] as FromTypeMapKind<ExtensionId>[typeof key]
               return [
                  key,
                  {
                     ".tx.rule": rule,
                     content: this.extension.encodeValue(rule, sourceValue),
                  },
               ]
            }
            return [key, _sourceObject[key]]
         })
      return Object.fromEntries(newObjectEntries) as TranslatedBy<
         T,
         FromTypeMapKind<ExtensionId>,
         ToTypeMapKind<ExtensionId>
      >
   }

   // planForDecode<T extends object>(
   //    sourceObject: T,
   // ): ApplicableRules<T, FromTypeMapKind<ExtensionId>> {
   //    const newObjectEntries = objectKeys(sourceObject)
   //       .filter((key: keyof T): boolean => {
   //          return typeof key === "string"
   //       })
   //       .map((key: keyof T): StringKeys<T> => {
   //          return key as StringKeys<T>
   //       })
   //       .map(
   //          (
   //             key: StringKeys<T>,
   //          ): [
   //             typeof key,
   //             (
   //                | RuleNameIfMapped<
   //                     T[typeof key],
   //                     FromTypeMapKind<ExtensionId>
   //                  >
   //                | undefined
   //             ),
   //          ] => {
   //             return [key, this.extension.selectRule(sourceObject[key])]
   //          },
   //       )
   //    return Object.fromEntries(newObjectEntries) as ApplicableRules<
   //       T,
   //       FromTypeMapKind<ExtensionId>
   //    >
   // }

   decodeWireObject<T extends object>(
      _transformedObject: TranslatedBy<
         T,
         FromTypeMapKind<ExtensionId>,
         ToTypeMapKind<ExtensionId>
      >,
      // appliedRules: ApplicableRules<T, FromTypeMapKind<ExtensionId>>,
   ): T {
      const newObjectEntries = objectKeys(_transformedObject)
         .filter((key: keyof T): boolean => {
            return typeof key === "string"
         })
         .map((key: keyof T): StringKeys<T> => {
            return key as StringKeys<T>
         })
         .map((key: StringKeys<T>): [typeof key, unknown] => {
            const sourceValue = _transformedObject[key]
            if (
               sourceValue !== null &&
               typeof sourceValue === "object" &&
               ".tx.rule" in sourceValue
            ) {
               const wrapped = sourceValue as unknown as {
                  ".tx.rule": MapRuleNamesKind<ExtensionId>
                  content: ToTypeMapKind<ExtensionId>[typeof rule]
               }
               const rule: MapRuleNamesKind<ExtensionId> = wrapped[".tx.rule"]
               return [key, this.extension.decodeValue(rule, wrapped.content)]
            }
            return [key, _transformedObject[key]]
         })
      return Object.fromEntries(newObjectEntries) as T
   }

   // encodeObjectByPlan<T extends object>(
   //    sourceObject: T,
   //    appliedRules: ApplicableRules<T, FromTypeMapKind<ExtensionId>>,
   // ): TranslatedBy<
   //    T,
   //    FromTypeMapKind<ExtensionId>,
   //    ToTypeMapKind<ExtensionId>
   // > {
   //    const newObjectEntries = objectKeys(sourceObject)
   //       .filter((key: keyof T): boolean => {
   //          return typeof key === "string"
   //       })
   //       .map((key: keyof T): StringKeys<T> => {
   //          return key as StringKeys<T>
   //       })
   //       .map((key: StringKeys<T>): [typeof key, unknown] => {
   //          const rule = appliedRules[key]
   //          if (rule !== undefined) {
   //             const sourceValue = sourceObject[
   //                key
   //             ] as FromTypeMapKind<ExtensionId>[typeof key]
   //             return [key, this.extension.encodeValue(rule, sourceValue)]
   //          }
   //          return [key, sourceObject[key]]
   //       })
   //    return Object.fromEntries(newObjectEntries) as TranslatedBy<
   //       T,
   //       FromTypeMapKind<ExtensionId>,
   //       ToTypeMapKind<ExtensionId>
   //    >
   // }
}
