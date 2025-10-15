import { Type } from "@nestjs/common"
import { IExtension, IExtensionClass } from "./IExtension.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import {
   ExtensionAdapterKind,
   ExtensionAdapterURIFromParts,
   ExtensionAdapterURItoKind,
} from "./IExtensionAdapter.js"

// export type IExtensionCollection<
//    ExtensionPoint extends string,
//    ExtensionApi extends {} = {},
//    ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint> = string,
// > = {
//    [K in ExtensionId]: [K, IExtension<ExtensionPoint, K> & ExtensionApi]
// }

export interface IAdapterCollection<
   ExtensionPoint extends string,
   AdapterId extends string,
> {
   fromFactory: () => IAdapterFactory<ExtensionPoint, AdapterId>

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

   unadapt: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
   ) => void
}
