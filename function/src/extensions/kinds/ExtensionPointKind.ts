/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { StringKeys } from "simplytyped"

/**
 * Extension classes must implement the interface their extension point places
 * here.
 */
export interface ToPayloadKind<ExtensionId extends string> {}

/**
 * Extension classes must accept constructor args their extension point places
 * here.
 */
export interface ToExtensionTArgsKind<ExtensionId extends string> {}

/**
 * Extension classes must provide static fields their extension point places
 * here.
 */
export interface ToStaticBodyKind<ExtensionId extends string> {}

/**
 * An extension point will add an entry pointing to the interface where it will
 * register any extension adapters it has created for wrapping contributed
 * extensions.
 */
export interface ToAdaptersRefKind<ExtensionId extends string> {}

/**
 * An extension point will add an entry keyed by their ExtensionPoint ID string
 * to set the interface type in their own module where contributing extensions
 * will add a reference to their contributed Class.   If that class satisfies the
 * requirements on constructor and content set by assignments into the Payload,
 * TArgs, and Static interfaces using the same ExtensionPoint ID, then the this
 * Extensions module will propagate their entry into its
 */
export interface ToExtensionsRefKind {}

/**
 * Any extension point that has specified all its extension requirements will find
 * its key listed in this union.
 */
export type KnownExtensionPointIds = StringKeys<ToPayloadKind<string>> &
   StringKeys<ToExtensionTArgsKind<string>> &
   StringKeys<ToStaticBodyKind<string>> &
   StringKeys<ToAdaptersRefKind<string>> &
   StringKeys<ToExtensionsRefKind>
