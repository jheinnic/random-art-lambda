import {
   ExtensionPayloadKind,
   ExtensionAdapterKind,
   KnownExtensionIds,
   KnownExtensionPointIds,
   KnownExtensionAdapterIds,
} from "../kinds/index.js"
import { IAdapterFactory } from "./IAdapterFactory.js"

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
