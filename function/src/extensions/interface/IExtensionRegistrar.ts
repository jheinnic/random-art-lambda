import { IExtension } from "./IExtension.js"

export interface IExtensionRegistrar<
   ExtensionPoint extends string,
   ExtensionApi extends {},
> {
   registerExtension: <ExtensionId extends string>(
      key: ExtensionId,
      extension: IExtension<ExtensionPoint, ExtensionId> & ExtensionApi,
   ) => void
}
