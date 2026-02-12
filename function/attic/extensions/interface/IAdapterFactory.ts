import {
   ExtensionPayloadKind,
   ExtensionAdapterKind,
   KnownExtensionIds,
   KnownExtensionPointIds,
   KnownExtensionAdapterIds,
} from "../kinds/index.js"
import "../../painting/seeding/kinds/Constants.js"

export interface IAdapterFactory<
   ExtensionPoint extends KnownExtensionPointIds,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> {
   readonly extensionPoint: ExtensionPoint
   readonly adapterId: AdapterId

   adapt: (
      extensionId: KnownExtensionIds<ExtensionPoint>,
      extension: ExtensionPayloadKind<ExtensionPoint, typeof extensionId>,
   ) => ExtensionAdapterKind<ExtensionPoint, AdapterId, typeof extensionId>
}
