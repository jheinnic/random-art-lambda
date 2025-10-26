import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"
import { KnownExtensionClassIds } from "../../extensions/kinds/ExtensionClassKind.js"

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GenModelSeedURItoKind {
   // Empty by default - plugins fill this in
   // readonly "FauxExtensionPoint/PlaceHoldingAdapter": ExtensionAdapterURItoKind<ExtensionId>
}

// 2. Extract valid URIs from whatever gets registered
export type KnownGenModelSeedURIs = keyof GenModelSeedURItoKind &
   KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>

// 3. Lookup helper
export type GenModelSeedKind<ExtensionId extends KnownGenModelSeedURIs> =
   GenModelSeedURItoKind[ExtensionId]

// Plugin authors use this
// declare module "./SeedModelKind.js" {
//    interface SeedModelURItoKind<_ExtensionId extends string> {
//       readonly "plugin-a/MyAdapter": MyAdapter<K>
//       //       ^^^^^^^^^ enforced pattern
//    }
// }
