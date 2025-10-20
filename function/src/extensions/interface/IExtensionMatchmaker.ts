import { IExtensionPoint } from "./IExtensionPoint.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import { KnownAdapterIds } from "./IExtensionAdapter.js"

/**
 */
export interface IExtensionMatchmaker<ExtensionPoint extends string> {
   registerExtensionPoint: (
      extensionPoint: IExtensionPoint<ExtensionPoint>,
   ) => void

   registerAdapterFactory: <AdapterId extends KnownAdapterIds<ExtensionPoint>>(
      adapterId: AdapterId,
      adapterFactory: IAdapterFactory<ExtensionPoint, AdapterId>,
   ) => void
}
