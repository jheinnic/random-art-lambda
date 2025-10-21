import { GEN_MODEL_SEED_TYPE_EXTENSION_POINT } from "./SeedTypeExtensionPoint"
import { KnownExtensionIds } from "../../extensions/interface/IExtension.js"
import { SeedTypeByExtension } from "./SeedTypeByExtension.js"

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SeedModelURItoKind {
   // Empty by default - plugins fill this in
   // readonly "FauxExtensionPoint/PlaceHoldingAdapter": ExtensionAdapterURItoKind<ExtensionId>
}

// 2. Extract valid URIs from whatever gets registered
type SeedModelURIs = keyof SeedModelURItoKind &
   KnownExtensionIds<GEN_MODEL_SEED_TYPE_EXTENSION_POINT>

// 3. Lookup helper
export type SeedModelKind<ExtensionId extends SeedModelURIs> =
   SeedModelURItoKind[ExtensionId]

// Plugin authors use this
// declare module "./SeedModelKind.js" {
//    interface SeedModelURItoKind<_ExtensionId extends string> {
//       readonly "plugin-a/MyAdapter": MyAdapter<K>
//       //       ^^^^^^^^^ enforced pattern
//    }
// }
