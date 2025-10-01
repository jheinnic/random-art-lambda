import { IExtension } from "./IExtension.js"
export type IExtensionAdapterClass<
   in out ExtensionPoint extends string,
   in ExtensionApi extends {},
> = new (
   key: string,
   ext: IExtension<ExtensionPoint, typeof key> & ExtensionApi,
) => any
