import { IExtension, IExtensionClass } from "./IExtension.js"

// export type IExtensionCollection<
//    ExtensionPoint extends string,
//    ExtensionApi extends {} = {},
//    ExtensionId extends string = string,
// > = {
//    [K in ExtensionId]: [K, IExtension<ExtensionPoint, K> & ExtensionApi]
// }

export interface IExtensionCollection<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> {
   setClass: <
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
   ) => void

   set: <
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
      value: InstanceType<ExtensionClass>,
   ) => void

   getClass: <
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(
      key: ExtensionId,
   ) => ExtensionClass | undefined

   get: <
      ExtensionId extends string,
      ExtensionClass extends IExtensionClass<
         ExtensionPoint,
         ExtensionId,
         PayloadType,
         TArgs
      >,
   >(
      key: ExtensionId,
      _clazz: ExtensionClass,
   ) => InstanceType<ExtensionClass> | undefined

   classKeys: () => string[]
   keys: () => string[]
}
