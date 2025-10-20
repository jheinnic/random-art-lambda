import { KnownExtensionIds } from "./IExtension.js"
import { NamespaceURI } from "./IExtensionPoint.js"

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionAdapterURItoKind<
   ExtensionPoint extends string,
   _ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> {
   // Empty by default - plugins fill this in
   // readonly "FauxExtensionPoint/PlaceHoldingAdapter": ExtensionAdapterURItoKind<ExtensionId>
}

// 2. Extract valid URIs from whatever gets registered
type ExtensionAdapterURIs<ExtensionPoint extends string> =
   keyof ExtensionAdapterURItoKind<ExtensionPoint, any> &
      NamespaceURI<ExtensionPoint, string>

export type KnownAdapterIds<ExtensionPoint extends string> =
   ExtensionAdapterURIs<ExtensionPoint> extends NamespaceURI<
      ExtensionPoint,
      infer Id
   >
      ? string extends Id
         ? never
         : Id
      : never

type ExtensionAdapterURIFromParts<
   ExtensionPoint extends string,
   AdapterId extends KnownAdapterIds<ExtensionPoint>,
> = NamespaceURI<ExtensionPoint, AdapterId> &
   ExtensionAdapterURIs<ExtensionPoint>

// 3. Lookup helper
export type ExtensionAdapterKind<
   ExtensionPoint extends string,
   AdapterId extends KnownAdapterIds<ExtensionPoint>,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = ExtensionAdapterURItoKind<
   ExtensionPoint,
   ExtensionId
>[ExtensionAdapterURIFromParts<ExtensionPoint, AdapterId>]

// Plugin authors use this
// declare module "./ExtensionAdapterKind.js" {
//    interface AdapterURItoKind<K extends string> {
//       readonly "plugin-a/MyAdapter": MyAdapter<K>
//       //       ^^^^^^^^^ enforced pattern
//    }
// }
