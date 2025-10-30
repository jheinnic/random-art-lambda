import { IExtensionPoint } from "./IExtensionPoint.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import {
   KnownExtensionAdapterIds,
   KnownExtensionPointIds,
} from "../kinds/index.js"

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
