import { NamespaceURI } from "./IExtensionPoint.js"
import {
   IExtensionClass,
   KnownExtensionIds,
   PayloadTypeKind,
} from "./IExtension.js"
import { ExtensionAdapterKind, KnownAdapterIds } from "./IExtensionAdapter.js"
import "../../seeding/interface/SeedTypeExtensionPoint.js"

export interface IAdapterFactory<
   ExtensionPoint extends string,
   AdapterId extends KnownAdapterIds<ExtensionPoint>,
> {
   URI: NamespaceURI<ExtensionPoint, AdapterId>

   adapt: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: PayloadTypeKind<ExtensionPoint, ExtensionId>,
   ) => ExtensionAdapterKind<ExtensionPoint, AdapterId, ExtensionId>
}
