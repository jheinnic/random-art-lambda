/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { StringKeys } from "simplytyped"
import { KnownExtensionAdapterIds } from "./ExtAdapterKind.js"
import { KnownExtensionIds, KnownExtensionPointIds } from "./ExtPointKind.js"

export const INDIRECT: unique symbol = Symbol("INDIRECTION")

/**
 * Extension classes must implement the interface their extension point places
 * here.  Alternately, the extension point can set a type that sets the
 * computed [INDIRECT] property to define a Hook interface in its own module
 * that allow that extension point to delegate setting this contract themselves.
 *
 * So, without [INDIRECT], an extension point may dictate control over the arguments
 * needed to construct every extension point.   With it, the extension point may allow
 * extensions to set their own constructor arguments.   Finally, an intermediate contract
 * may exist by pointing [INDIRECT] at a purely derived interface type where that
 * derivation is computed from Kinds associate with other Hooks defined by the extension
 * point in order to create a specific flexibility in the constructor arguments.
 *
 * An example of this intermediate use could manifest as an extension point whose
 * implementors should always provide a string tuple and a record based on that tuple,
 * but the individual extension provider can determine what string to use for their
 * tuple.
 */
export interface HooksForExtPayload<_ExtensionId extends string> {}

/**
 * Extension classes must accept constructor args their extension point places
 * here.
 */
export interface HooksForExtTArgs<_ExtensionId extends string> {}

/**
 * Extension classes must provide static fields their extension point places
 * here.
 */
export interface HooksForExtStaticPayload<_ExtensionId extends string> {}

/**
 * An extension point will add an entry keyed by their ExtensionPoint ID string
 * to set the interface type in their own module where contributing extensions
 * will add a reference to their contributed Class.   If that class satisfies the
 * requirements on constructor and content set by assignments into the Payload,
 * TArgs, and Static interfaces using the same ExtensionPoint ID, then the this
 * Extensions module will propagate their entry into its
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export interface HooksForHooksForExtensionClasses {}

// Extension Point Plugin authors use this
// declare module "../../extensions/kinds/ExtPointHooks.js" {
//    interface HooksForHooksForExtensionClasses {
//       readonly ExtensionPointName: HooksForExtensionClasses
//       //       ^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^ enforced patterns
//    }
// }
//
// Extension Plugin authors use this, requiring the module where the Extension Point
// they are contributing to defined its HookForExtensionClasses interface.
// declare module "../../some_feature/kinds/SomeFeatureHooks.js" {
//    interface HooksForExtensionClasses {
//       readonly ExtensionId: ExtensionClass
//                ^^^^^^^^^^^  ^^^^^^^^^^^^^^ enforced patterns
//    }
// }
