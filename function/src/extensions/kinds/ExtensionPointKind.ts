/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { StringKeys } from "simplytyped"

/**
 * Extension classes must implement the interface their extension point places
 * here.
 */
export interface ToExtPayloadKind<ExtensionId extends string> {}

/**
 * Extension classes must accept constructor args their extension point places
 * here.
 */
export interface ToExtTArgsKind<ExtensionId extends string> {}

/**
 * Extension classes must provide static fields their extension point places
 * here.
 */
export interface ToExtStaticBodyKind<ExtensionId extends string> {}

/**
 * An extension point will add an entry pointing to the interface where it will
 * register any extension adapters it has created for wrapping contributed
 * extensions.
 */
export interface ToExtAdaptersRefKind<ExtensionId extends string> {}

/**
 * An extension point will add an entry keyed by their ExtensionPoint ID string
 * to set the interface type in their own module where contributing extensions
 * will add a reference to their contributed Class.   If that class satisfies the
 * requirements on constructor and content set by assignments into the Payload,
 * TArgs, and Static interfaces using the same ExtensionPoint ID, then the this
 * Extensions module will propagate their entry into its
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export interface ToExtensionsRefKind {}
