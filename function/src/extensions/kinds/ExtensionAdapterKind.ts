import {
   KnownExtensionClassIds,
   KnownPayloadIds,
   PayloadTypeKind,
} from "./ExtensionClassKind.js"
import { NamespaceURI } from "./NamespaceURI.js"

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionAdapterURItoKind<
   ExtensionPoint extends string,
   ExtensionId extends KnownPayloadIds<ExtensionPoint>,
> {
   // Empty by default - plugins fill this in
   // readonly "FauxExtensionPoint/PlaceHoldingAdapter": ExtensionAdapterURItoKind<ExtensionId>
}

// 2. Extract valid URIs from whatever gets registered
type ExtensionAdapterURIs<ExtensionPoint extends string> =
   keyof ExtensionAdapterURItoKind<
      ExtensionPoint,
      KnownPayloadIds<ExtensionPoint>
   > &
      NamespaceURI<ExtensionPoint, string>

export type KnownExtensionAdapterIds<ExtensionPoint extends string> =
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
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> = NamespaceURI<ExtensionPoint, AdapterId> &
   ExtensionAdapterURIs<ExtensionPoint>

// 3. Lookup helper
export type ExtensionAdapterKind<
   ExtensionPoint extends string,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
   ExtensionPayload extends KnownPayloadIds<ExtensionPoint>,
> = ExtensionAdapterURItoKind<
   ExtensionPoint,
   ExtensionPayload
>[ExtensionAdapterURIFromParts<ExtensionPoint, AdapterId>]

// Plugin authors use this
// declare module "./ExtensionAdapterKind.js" {
//    interface ExtensionAdapterURItoKind<K extends string> {
//       readonly "ExtensionPointName/MyAdapterName": MyAdapter<K>
//       //        ^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^ enforced pattern
//    }
// }
