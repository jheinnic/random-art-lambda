import { NamespaceURI } from "./IExtensionPoint.js"
import {
   IExtensionClass,
   KnownPayloadIds,
   KnownTArgsIds,
} from "./IExtension.js"
import {
   ExtensionAdapterKind,
   ExtensionAdapterURIFromParts,
   ExtensionAdapterURItoKind,
} from "./IExtensionAdapter.js"
import "../../seeding/interface/SeedTypeExtensionPoint.js"

export interface IAdapterFactory<
   ExtensionPoint extends string,
   AdapterId extends string,
> {
   URI: NamespaceURI<ExtensionPoint, AdapterId>

   adapt: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ) => ExtensionAdapterKind<
      ExtensionAdapterURIFromParts<ExtensionPoint, AdapterId>,
      ExtensionId
   >
}

export const foo: ExtensionAdapterURItoKind<string>["GenModelSeedType/GenModelSeedAdapter"] =
   { vb: 4 }
