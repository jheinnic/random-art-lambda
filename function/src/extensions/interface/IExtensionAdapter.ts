import { KnownExtensionIds } from "./IExtension.js"
import { NamespaceURI } from "./IExtensionPoint.js"

// 1. Base interface that plugins will augment
export interface ExtensionAdapterURItoKind<ExtensionId extends string> {
   // Empty by default - plugins fill this in
   readonly "FauxExtensionPoint/PlaceHoldingAdapter": ExtensionAdapterURItoKind<ExtensionId>
}

// 2. Extract valid URIs from whatever gets registered
type ExtensionAdapterURIs = keyof ExtensionAdapterURItoKind<any>

export type KnownAdapterIds<ExtensionPoint extends string> =
   ExtensionAdapterURIs extends NamespaceURI<ExtensionPoint, infer Id>
      ? Id
      : never

type ExtensionAdapterURIFromParts<
   ExtensionPoint extends string,
   AdapterId extends string,
> = NamespaceURI<ExtensionPoint, AdapterId> & ExtensionAdapterURIs

// 3. Lookup helper
export type ExtensionAdapterKind<
   ExtensionPoint extends string,
   AdapterId extends KnownAdapterIds<ExtensionPoint>,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = ExtensionAdapterURItoKind<ExtensionId>[ExtensionAdapterURIFromParts<
   ExtensionPoint,
   AdapterId
>]

// Plugin authors use this
// declare module "./ExtensionAdapterKind.js" {
//    interface AdapterURItoKind<K extends string> {
//       readonly "plugin-a/MyAdapter": MyAdapter<K>
//       //       ^^^^^^^^^ enforced pattern
//    }
// }
