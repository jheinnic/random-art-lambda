import { IExtension } from "./IExtension.js"
import { IExtensionAdapterClass } from "./IExtensionAdapterClass.js"

export interface IAdapterFactory<
   in out ExtensionPoint extends string,
   in ExtensionApi extends {},
   in AdapterType extends IExtensionAdapterClass<ExtensionPoint, ExtensionApi>,
> {
   adapt: (
      extensionPoint: ExtensionPoint,
      extension: IExtension<ExtensionPoint> & ExtensionApi,
   ) => InstanceType<AdapterType>
}
