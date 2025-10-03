import { IExtension } from "./IExtension.js"
import { IExtensionPoint } from "./IExtensionPoint.js"
import { IAdapterFactory } from "./IAdapterFactory.js"

/**
 */
export interface IExtensionMatchmaker<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> {
   registerExtensionPoint: (
      extensionPoint: IExtensionPoint<ExtensionPoint, PayloadType, TArgs>,
   ) => void

   registerAdapterFactory: <Adapter extends object>(
      adapterFactory: IAdapterFactory<
         ExtensionPoint,
         PayloadType,
         TArgs,
         Adapter
      >,
   ) => void
}
