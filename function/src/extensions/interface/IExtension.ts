import { NamespaceURI } from "./IExtensionPoint.js"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface IExtension<in ExtensionId extends string> {
/* common instance methods/properties */
// }

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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionPayloadTypeURItoKind {
   // Empty by default - plugins fill this in
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionTArgsURItoKind {
   // Empty by default - plugins fill this in
}

// 2. Extract valid URIs from whatever gets registered
export type ExtensionPayloadTypeURIs<ExtensionPoint extends string> =
   keyof ExtensionPayloadTypeURItoKind & NamespaceURI<ExtensionPoint, string>

export type ExtensionTArgsURIs<ExtensionPoint extends string> =
   keyof ExtensionTArgsURItoKind & NamespaceURI<ExtensionPoint, string>

export type KnownPayloadIds<ExtensionPoint extends string> =
   ExtensionPayloadTypeURIs<ExtensionPoint> extends NamespaceURI<
      ExtensionPoint,
      infer Id
   >
      ? string extends Id
         ? never
         : Id
      : never

export type KnownTArgsIds<ExtensionPoint extends string> =
   ExtensionTArgsURIs<ExtensionPoint> extends NamespaceURI<
      ExtensionPoint,
      infer Id
   >
      ? string extends Id
         ? never
         : Id
      : never

export type KnownExtensionIds<ExtensionPoint extends string> =
   KnownPayloadIds<ExtensionPoint> & KnownTArgsIds<ExtensionPoint>

type ExtensionPayloadTypeURIFromParts<
   ExtensionPoint extends string,
   ExtensionId extends KnownPayloadIds<ExtensionPoint>,
> = NamespaceURI<ExtensionPoint, ExtensionId> &
   ExtensionPayloadTypeURIs<ExtensionPoint>

type ExtensionTArgsURIFromParts<
   ExtensionPoint extends string,
   ExtensionId extends KnownTArgsIds<ExtensionPoint>,
> = NamespaceURI<ExtensionPoint, ExtensionId> &
   ExtensionTArgsURIs<ExtensionPoint>

// 3. Lookup helpers
export type PayloadTypeKind<
   ExtensionPoint extends string,
   ExtensionId extends KnownPayloadIds<ExtensionPoint>,
> = ExtensionPayloadTypeURItoKind[ExtensionPayloadTypeURIFromParts<
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
