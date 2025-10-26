import {
   ExtensionClassKind,
   KnownExtensionClassIds,
   KnownPayloadIds,
   KnownTArgsIds,
   TArgsKind,
} from "../kinds/ExtensionClassKind.js"

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
   registerExtension: (
      extensionId: KnownExtensionClassIds<ExtensionPoint>,
      clazz: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      args: TArgsKind<ExtensionPoint, typeof extensionId>,
   ) => void
}
