import { IExtensionCollection } from "./IExtensionCollection.js"
import { IExtension } from "./IExtension.js"
import { IAdapterCollection } from "./IAdapterCollection.js"

export interface IExtensionPoint<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[] = [],
> {
   receiveExtensions: (
      extensions: IExtensionCollection<ExtensionPoint, PayloadType, TArgs>,
      adapters: IAdapterCollection<ExtensionPoint, PayloadType, TArgs>,
   ) => void
}
