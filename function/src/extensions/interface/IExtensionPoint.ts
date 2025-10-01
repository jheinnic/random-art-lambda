import { IAdapterFactory } from "./IAdapterFactory.js"
import { IExtensionAdapterClass } from "./IExtensionAdapterClass.js"
import { IExtensionCollection } from "./IExtensionCollection.js"

export interface IExtensionPoint<
   ExtensionPoint extends string,
   ExtensionApi extends {} = {},
> {
   extensionPoint: ExtensionPoint

   receiveExtensions: <ExtensionIds extends string>(
      extensions: IExtensionCollection<
         ExtensionPoint,
         ExtensionApi,
         ExtensionIds
      >,
      idsPresent: ExtensionIds[],
   ) => void

   receiveAdapters: <
      AdapterClass extends IExtensionAdapterClass<ExtensionPoint, ExtensionApi>,
   >(
      adapterFactory: IAdapterFactory<
         ExtensionPoint,
         ExtensionApi,
         AdapterClass
      >,
      adapters: Array<InstanceType<AdapterClass>>,
   ) => void
}
