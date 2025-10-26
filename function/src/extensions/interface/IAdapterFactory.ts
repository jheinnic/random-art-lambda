import {
   KnownExtensionClassIds,
   PayloadTypeKind,
} from "../kinds/ExtensionClassKind.js"
import {
   ExtensionAdapterKind,
   KnownExtensionAdapterIds,
} from "../kinds/ExtensionAdapterKind.js"
import "../../seeding/kinds/Constants.js"

export interface IAdapterFactory<
   ExtensionPoint extends string,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> {
   readonly extensionPoint: ExtensionPoint
   readonly adapterId: AdapterId

   adapt: (
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
      extension: PayloadTypeKind<ExtensionPoint, typeof extensionId>,
   ) => ExtensionAdapterKind<ExtensionPoint, AdapterId, typeof extensionId>
}
