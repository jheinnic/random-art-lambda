import {
   ExtensionClassKind,
   KnownExtensionIds,
   ExtensionPayloadKind,
} from "../kinds/ExtensionKind.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import {
   ExtensionAdapterKind,
   KnownExtensionAdapterIds,
} from "../kinds/ExtensionAdapterKind.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

export interface IAdapterCollection<
   ExtensionPoint extends KnownExtensionPointIds,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> {
   fromFactory: () => IAdapterFactory<ExtensionPoint, AdapterId>

   adapt: (
      extensionId: KnownExtensionIds<ExtensionPoint>,
      extension: ExtensionPayloadKind<ExtensionPoint, typeof extensionId>,
   ) => ExtensionAdapterKind<ExtensionPoint, AdapterId, typeof extensionId>

   unadapt: (extensionId: KnownExtensionIds<ExtensionPoint>) => void
}
