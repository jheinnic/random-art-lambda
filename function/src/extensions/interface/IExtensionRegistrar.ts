import {
   IExtensionClass,
   KnownPayloadIds,
   KnownTArgsIds,
   TArgsKind,
} from "./IExtension.js"

// export interface IExtensionRegistrar<
//    ExtensionPoint extends string,
//    ExtensionApi extends new <ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>>(
//       extensionPoint: ExtensionPoint,
//       extensionId: ExtensionId,
//    ) => IExtensionClass<ExtensionPoint, ExtensionId>,
// > {
//    registerExtension: <
//       ExtensionId extends KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>,
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
export interface IExtensionRegistrar<ExtensionPoint extends string> {
   // TClass is the unique concrete structure ALL registered classes must match.
   // It must be a specific type of IExtensionClass, fixed to the ExtensionPoint.
   // The concrete class must match the Registrar's TClass constraint and conform
   // to the specific ExtensionId.
   /**
    * Registers a concrete ExtensionClass.
    * * @param key The specific ExtensionId.
    * @param clazz The concrete class constructor being registered.
    */
   registerExtension: <ExtensionId extends KnownExtensionIds<ExtensionPoint>>(
      key: ExtensionId,
      clazz: IExtensionClass<ExtensionPoint, ExtensionId>,
      args: TArgsKind<ExtensionPoint, ExtensionId>,
   ) => void
}
