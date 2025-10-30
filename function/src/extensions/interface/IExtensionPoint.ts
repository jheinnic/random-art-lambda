import {
   KnownExtensionAdapterIds,
   KnownExtensionPointIds,
} from "../kinds/index.js"
import { IExtensionCollection } from "./IExtensionCollection.js"
import { IAdapterCollection } from "./IAdapterCollection.js"

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
