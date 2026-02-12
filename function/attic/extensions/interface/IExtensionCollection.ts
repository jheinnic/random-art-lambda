import {
   KnownExtensionIds,
   ExtensionClassKind,
   ExtensionTArgsKind,
   ExtensionPayloadKind,
} from "../kinds/ExtPointKind.js"
import { KnownExtensionPointIds } from "../kinds/index.js"

export interface IExtensionCollection<
   ExtensionPoint extends KnownExtensionPointIds,
> {
   setClass: <ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
      extensionClass: ExtensionClassKind<ExtensionPoint, ExtensionId>,
      ...args: ExtensionTArgsKind<ExtensionPoint, ExtensionId>
   ) => void

   getClass: <ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
   ) => ExtensionClassKind<ExtensionPoint, ExtensionId>

   get: <ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      extensionId: ExtensionId,
   ) => ExtensionPayloadKind<ExtensionPoint, ExtensionId>

   readonly classKeys: Array<KnownExtensionIds<ExtensionPoint>>
   readonly keys: Array<KnownExtensionIds<ExtensionPoint>>
}
