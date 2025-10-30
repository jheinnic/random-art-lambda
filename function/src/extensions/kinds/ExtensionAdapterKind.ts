import { StringKeys } from "simplytyped"
import {
   KnownExtensionPointIds,
   ToExtAdaptersRefKind,
} from "./ExtensionPointKind.js"
import { KnownExtensionIds } from "./ExtensionKind.js"

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface ExtensionAdapterURItoKind<
//    ExtensionPoint extends KnownExtensionPointIds,
//    ExtensionId extends KnownExtensionIds<ExtensionPoint>,
// > {
//    // Empty by default - plugins fill this in
//    // readonly "FauxExtensionPoint/PlaceHoldingAdapter": ExtensionAdapterURItoKind<ExtensionId>
// }

// 2. Extract valid URIs from whatever gets registered
export type KnownExtensionAdapterIds<
   ExtensionPoint extends KnownExtensionPointIds,
> = StringKeys<
   ToExtAdaptersRefKind<KnownExtensionIds<ExtensionPoint>>[ExtensionPoint]
>

// 3. Lookup helper
export type ExtensionAdapterKind<
   ExtensionPoint extends KnownExtensionPointIds,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = ToExtAdaptersRefKind<ExtensionId>[ExtensionPoint][AdapterId]

// Plugin authors use this
// declare module "./ExtensionAdapterKind.js" {
//    interface ExtensionAdapterURItoKind<K extends string> {
//       readonly "ExtensionPointName/MyAdapterName": MyAdapter<K>
//       //        ^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^ enforced pattern
//    }
// }
