import {
   ExtensionClassKind,
   KnownExtensionClassIds,
   PayloadTypeKind,
} from "../kinds/ExtensionClassKind.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import {
   ExtensionAdapterKind,
   KnownExtensionAdapterIds,
} from "../kinds/ExtensionAdapterKind.js"

export interface IAdapterCollection<
   ExtensionPoint extends string,
   AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
> {
   fromFactory: () => IAdapterFactory<ExtensionPoint, AdapterId>

   adapt: (
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
      extensionClass: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      extension: PayloadTypeKind<ExtensionPoint, typeof extensionId>,
   ) => ExtensionAdapterKind<ExtensionPoint, AdapterId, typeof extensionId>

   unadapt: (extensionId: KnownExtensionClassIds<ExtensionPoint>) => void
}
