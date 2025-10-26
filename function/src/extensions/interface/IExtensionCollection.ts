import {
   KnownExtensionIds,
   ExtensionClassKind,
   ExtensionTArgsKind,
   ExtensionPayloadKind,
} from "../kinds/ExtensionKind.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

export interface IExtensionCollection<
   ExtensionPoint extends KnownExtensionPointIds,
> {
   setClass: (
      extensionId: KnownExtensionIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      ...args: ExtensionTArgsKind<ExtensionPoint, typeof extensionId>
   ) => void

   getClass: (
      extensionId: KnownExtensionIds<ExtensionPoint>,
   ) => ExtensionClassKind<ExtensionPoint, typeof extensionId>

   get: (
      extensionId: KnownExtensionIds<ExtensionPoint>,
   ) => ExtensionPayloadKind<ExtensionPoint, typeof extensionId>

   readonly classKeys: Array<KnownExtensionIds<ExtensionPoint>>
   readonly keys: Array<KnownExtensionIds<ExtensionPoint>>
}
