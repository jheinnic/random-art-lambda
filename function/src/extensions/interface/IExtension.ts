import { NamespaceURI } from "./IExtensionPoint.js"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IExtension<
   in ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> {
   /* common instance methods/properties */
}

export interface IExtensionKey<
   in out ExtensionPoint extends string,
   out ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> {
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}

// IExtensionClass models the constructor and static fields of any extension class
export interface IExtensionClass<
   in out ExtensionPoint extends string,
   in out ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> extends Function {
   // Constructor signature
   new (
      ...args: TArgsKind<ExtensionPoint, ExtensionId>
   ): PayloadTypeKind<ExtensionPoint, ExtensionId>
   // Static properties required for registration
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}

// 1. Base interface that plugins will augment
export interface ExtensionPayloadTypeURItoKind<ExtensionId extends string> {
   // Empty by default - plugins fill this in
   "ZauxExtensionPoint/GenericExtension": ExtensionPayloadTypeURItoKind<ExtensionId>
   "FauxExtensionPoint/BasicExtension": object
}

export interface ExtensionTArgsURItoKind {
   // Empty by default - plugins fill this in
   "FauxExtensionPoint/PlaceholderExtension": [string, number]
}

// 2. Extract valid URIs from whatever gets registered
export type ExtensionPayloadTypeURIs =
   keyof ExtensionPayloadTypeURItoKind<any> & NamespaceURI<string, string>

export type ExtensionTArgsURIs = keyof ExtensionTArgsURItoKind &
   NamespaceURI<string, string>

export type KnownPayloadIds<ExtensionPoint extends string> =
   ExtensionPayloadTypeURIs extends NamespaceURI<infer Ep, infer Id>
      ? Ep extends ExtensionPoint
         ? Id
         : never
      : never

export type KnownTArgsIds<ExtensionPoint extends string> =
   ExtensionTArgsURIs extends NamespaceURI<infer Ep, infer Id>
      ? Ep extends ExtensionPoint
         ? Id
         : never
      : never

export type KnownExtensionIds<ExtensionPoint extends string> =
   KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>

type ExtensionPayloadTypeURIFromParts<
   ExtensionPoint extends string,
   ExtensionId extends KnownPayloadIds<ExtensionPoint>,
> = NamespaceURI<ExtensionPoint, ExtensionId> & ExtensionPayloadTypeURIs

type ExtensionTArgsURIFromParts<
   ExtensionPoint extends string,
   ExtensionId extends KnownTArgsIds<ExtensionPoint>,
> = NamespaceURI<ExtensionPoint, ExtensionId> & ExtensionTArgsURIs

// 3. Lookup helpers
export type PayloadTypeKind<
   ExtensionPoint extends string,
   ExtensionId extends KnownPayloadIds<ExtensionPoint>,
> = ExtensionPayloadTypeURItoKind<ExtensionId>[ExtensionPayloadTypeURIFromParts<
   ExtensionPoint,
   ExtensionId
>]

export type TArgsKind<
   ExtensionPoint extends string,
   ExtensionId extends KnownTArgsIds<ExtensionPoint>,
> = ExtensionTArgsURItoKind[ExtensionTArgsURIFromParts<
   ExtensionPoint,
   ExtensionId
>]
