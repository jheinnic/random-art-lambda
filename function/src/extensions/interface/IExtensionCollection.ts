import {
   KnownExtensionClassIds,
   ExtensionClassKind,
   TArgsKind,
   PayloadTypeKind,
} from "../kinds/ExtensionClassKind.js"

export interface IExtensionCollection<ExtensionPoint extends string> {
   setClass: (
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      ...args: TArgsKind<ExtensionPoint, typeof extensionId>
   ) => void

   getClass: (
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
   ) => ExtensionClassKind<ExtensionPoint, typeof extensionId>

   get: (
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
   ) => PayloadTypeKind<ExtensionPoint, typeof extensionId>

   readonly classKeys: Array<KnownExtensionClassIds<ExtensionPoint>>
   readonly keys: Array<KnownExtensionClassIds<ExtensionPoint>>
}
