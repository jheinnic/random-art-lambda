import {
   KnownExtensionIds,
   ExtensionPayloadKind,
} from "../kinds/ExtensionKind.js"
import {
   ExtensionAdapterKind,
   KnownExtensionAdapterIds,
} from "../kinds/ExtensionAdapterKind.js"
import "../../seeding/kinds/Constants.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

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
