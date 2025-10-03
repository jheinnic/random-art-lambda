import { IExtension, IExtensionClass } from "./IExtension.js"

export interface IAdapterFactory<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
   Adapter extends object,
> {
   adapt: <ExtensionId extends string>(
      key: ExtensionId,
      clazz: IExtensionClass<ExtensionPoint, ExtensionId, PayloadType, TArgs>,
      extension: InstanceType<typeof clazz>,
   ) => Adapter
}
