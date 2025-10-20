import { IExtensionClass, KnownExtensionIds } from "./IExtension.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import { ExtensionAdapterKind, KnownAdapterIds } from "./IExtensionAdapter.js"

export interface IAdapterCollection<
   ExtensionPoint extends string,
   AdapterId extends KnownAdapterIds<ExtensionPoint>,
> {
   fromFactory: () => IAdapterFactory<ExtensionPoint, AdapterId>

   adapt: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ) => ExtensionAdapterKind<ExtensionPoint, AdapterId, ExtensionId>

   unadapt: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ) => void
}
