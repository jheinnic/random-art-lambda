import {
   ExtensionTArgsURIFromParts,
   IExtensionClass,
   TArgsKind,
} from "./IExtension.js"

// export type IExtensionCollection<
//    ExtensionPoint extends string,
//    ExtensionApi extends {} = {},
//    ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint> = string,
// > = {
//    [K in ExtensionId]: [K, IExtension<ExtensionPoint, K> & ExtensionApi]
// }

export interface IExtensionCollection<ExtensionPoint extends string> {
   setClass: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
      ...args: TArgsKind<
         ExtensionTArgsURIFromParts<ExtensionPoint, ExtensionId>
      >
   ) => void

   // set: <
   //    ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>,
   //    ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   // >(
   //    key: ExtensionId,
   //    clazz: ExtensionClass,
   //    value: InstanceType<ExtensionClass>,
   // ) => void

   getClass: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
   ) => ExtensionClass | undefined

   get: <
      ExtensionId extends KnownExtensionIds<ExtensionPoint>,
      ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
   >(
      key: ExtensionId,
      clazz: ExtensionClass,
   ) => InstanceType<ExtensionClass> | undefined

   classKeys: () => string[]
   keys: () => string[]
}
