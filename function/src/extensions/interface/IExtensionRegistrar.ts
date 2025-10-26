import {
   ExtensionClassKind,
   KnownExtensionIds,
   ExtensionTArgsKind,
} from "../kinds/ExtensionKind.js"
import { KnownExtensionPointIds } from "../kinds/ExtensionPointKind.js"

/**
 * The Registrar is generic over the ExtensionPoint and the specific CLASS type
 * that all extensions in this point MUST conform to.
 */
export interface IExtensionRegistrar<
   ExtensionPoint extends KnownExtensionPointIds,
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
   registerExtension: (
      extensionId: KnownExtensionIds<ExtensionPoint>,
      clazz: ExtensionClassKind<ExtensionPoint, typeof extensionId>,
      args: ExtensionTArgsKind<ExtensionPoint, typeof extensionId>,
   ) => void
}
