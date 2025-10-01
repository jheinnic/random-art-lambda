import { IExtension } from "./IExtension.js"

export type IExtensionCollection<
   ExtensionPoint extends string,
   ExtensionApi extends {} = {},
   ExtensionId extends string = string,
> = {
   [K in ExtensionId]: IExtension<ExtensionPoint, K> & ExtensionApi
}
