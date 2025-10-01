import { IExtensionPoint } from "./IExtensionPoint.js"
import { IAdapterFactory } from "./IAdapterFactory.js"
import { IExtensionAdapterClass } from "./IExtensionAdapterClass.js"

/**
 */
export interface IExtensionMatchmaker<
   ExtensionPoint extends string,
   ExtensionApi extends {},
> {
   registerExtensionPoint: (
      extensionPoint: IExtensionPoint<ExtensionPoint, ExtensionApi>,
   ) => void

   registerForAdapters: <
      AdapterType extends IExtensionAdapterClass<ExtensionPoint, ExtensionApi>,
   >(
      extensionPoint: IExtensionPoint<ExtensionPoint, ExtensionApi>,
      adapterFactory: IAdapterFactory<
         ExtensionPoint,
         ExtensionApi,
         AdapterType
      >,
   ) => void
}
