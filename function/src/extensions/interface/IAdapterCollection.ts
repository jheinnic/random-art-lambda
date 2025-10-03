import { Type } from "@nestjs/common"
import { IExtension, IExtensionClass } from "./IExtension.js"
import { IAdapterFactory } from "./IAdapterFactory.js"

// export type IExtensionCollection<
//    ExtensionPoint extends string,
//    ExtensionApi extends {} = {},
//    ExtensionId extends string = string,
// > = {
//    [K in ExtensionId]: [K, IExtension<ExtensionPoint, K> & ExtensionApi]
// }

export interface IAdapterCollection<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> {
   addFactory: <Adapter extends object>(
      factory: IAdapterFactory<ExtensionPoint, PayloadType, TArgs, Adapter>,
   ) => void

   adaptWith: <
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
      Adapter extends object,
      AdapterFactory extends IAdapterFactory<
         ExtensionPoint,
         PayloadType,
         TArgs,
         Adapter
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
      factory: AdapterFactory,
   ) => Adapter | undefined

   unadapt: <
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
      Adapter extends object,
      AdapterFactory extends IAdapterFactory<
         ExtensionPoint,
         PayloadType,
         TArgs,
         Adapter
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
      extension: InstanceType<ExtensionClass>,
      factory: AdapterFactory,
      adapter: Adapter,
   ) => void

   adapterFactories: () => Array<
      [IAdapterFactory<ExtensionPoint, PayloadType, TArgs, object>, object]
   >
}
