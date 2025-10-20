import { IExtensionCollection } from "./IExtensionCollection.js"
import { IAdapterCollection } from "./IAdapterCollection.js"
import { KnownAdapterIds } from "./IExtensionAdapter.js"

export interface IExtensionPoint<ExtensionPoint extends string> {
   receiveExtensions: (
      extensions: IExtensionCollection<ExtensionPoint>,
      adapters: {
         [AdapterId in KnownAdapterIds<ExtensionPoint>]: IAdapterCollection<
            ExtensionPoint,
            AdapterId
         >
      },
   ) => void
}

export type NamespaceURI<
   ExtensionPoint extends string,
   Name extends string,
> = `${ExtensionPoint}/${Name}`

// In your registry
export type PluginNamespace = string & { __brand: "PluginNamespace" }
