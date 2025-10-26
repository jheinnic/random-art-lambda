import { IExtensionPoint } from "./IExtensionPoint.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import { KnownExtensionAdapterIds } from "../kinds/ExtensionAdapterKind.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

/**
 */
export interface IExtensionMatchmaker<
   ExtensionPoint extends KnownExtensionPointIds,
> {
   registerExtensionPoint: (
      extensionPoint: IExtensionPoint<ExtensionPoint>,
   ) => void

   registerAdapterFactory: <
      AdapterId extends KnownExtensionAdapterIds<ExtensionPoint>,
   >(
      adapterId: AdapterId,
      adapterFactory: IAdapterFactory<ExtensionPoint, AdapterId>,
   ) => void
}
