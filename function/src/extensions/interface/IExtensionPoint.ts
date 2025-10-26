import { IExtensionCollection } from "./IExtensionCollection.js"
import { IAdapterCollection } from "./IAdapterCollection.js"
import { KnownExtensionAdapterIds } from "../kinds/ExtensionAdapterKind.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

export interface IExtensionPoint<
   ExtensionPoint extends KnownExtensionPointIds,
> {
   receiveExtensions: (
      extensions: IExtensionCollection<ExtensionPoint>,
      adapters: {
         [AdapterId in KnownExtensionAdapterIds<ExtensionPoint>]?: IAdapterCollection<
            ExtensionPoint,
            AdapterId
         >
      },
   ) => void
}
