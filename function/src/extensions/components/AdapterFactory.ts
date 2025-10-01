import { IAdapterFactory } from "../interface/IAdapterFactory.js"
import { IExtension } from "../interface/IExtension.js"
import { IExtensionAdapterClass } from "../interface/IExtensionAdapterClass.js"

export class AdapterFactory<
   ExtensionPoint extends string,
   ExtensionApi extends {},
   AdapterType extends IExtensionAdapterClass<ExtensionPoint, ExtensionApi>,
> implements IAdapterFactory<ExtensionPoint, ExtensionApi, AdapterType>
{
   constructor(private readonly AdapterClass: AdapterType) {}

   adapt(
      extensionPoint: ExtensionPoint,
      extension: IExtension<ExtensionPoint> & ExtensionApi,
   ): InstanceType<AdapterType> {
      return new this.AdapterClass(extensionPoint, extension)
   }
}
