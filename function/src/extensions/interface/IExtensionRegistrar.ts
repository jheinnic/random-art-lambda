import { IExtension, IExtensionClass } from "./IExtension.js"

// export interface IExtensionRegistrar<
//    ExtensionPoint extends string,
//    ExtensionApi extends new <ExtensionId extends string>(
//       extensionPoint: ExtensionPoint,
//       extensionId: ExtensionId,
//    ) => IExtensionClass<ExtensionPoint, ExtensionId>,
// > {
//    registerExtension: <
//       ExtensionId extends string,
//       // ExtensionClass extends IExtensionClass<ExtensionPoint, ExtensionId>,
//    >(
//       key: ExtensionId,
//       clazz: ExtensionApi<ExtensionId>,
//       extension: InstanceType<typeof clazz>,
//    ) => void
// }

/**
 * The Registrar is generic over the ExtensionPoint and the specific CLASS type
 * that all extensions in this point MUST conform to.
 */
export interface IExtensionRegistrar<
   ExtensionPoint extends string,
   PayloadType extends IExtension,
   TArgs extends any[],
> {
   // TClass is the unique concrete structure ALL registered classes must match.
   // It must be a specific type of IExtensionClass, fixed to the ExtensionPoint.
   // The concrete class must match the Registrar's TClass constraint and conform
   // to the specific ExtensionId.
   /**
    * Registers a concrete ExtensionClass.
    * * @param key The specific ExtensionId.
    * @param clazz The concrete class constructor being registered.
    */
   registerExtension: <ExtensionId extends string>(
      key: ExtensionId,
      clazz: IExtensionClass<ExtensionPoint, ExtensionId, PayloadType, TArgs>,
   ) => void
}
