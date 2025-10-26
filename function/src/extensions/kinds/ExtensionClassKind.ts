import { ConstructorFor, ConstructorFunction } from "simplytyped"
import { NamespaceURI } from "./NamespaceURI.js"

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// export interface IExtension<in ExtensionId extends string> {
/* common instance methods/properties */
// }

// 1. Base interface that plugins will augment
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionPayloadTypeURItoKind {
   // Empty by default - plugins fill this in
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExtensionTArgsURItoKind {
   // Empty by default - plugins fill this in
}

export interface ExtensionPointURItoTArgsKind<
   ExtensionPoint extends KnownExtensionPointURIs,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> {
   [K: KnownExtensionPointURIs]: any[]
}

export interface ExtensionPointURItoPayloadKind<
   ExtensionPoint extends KnownExtensionPointURIs,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> {
   [K: KnownExtensionPointURIs]: object
}

// export interface ExtensionClassURItoKind<> {}

export interface ExtensionPointURItoExtensionIdURItoKind {
   [ExtensionPoint: string]: {
      [ExtensionId: string]: ConstructorFunction<object>
   }
}

export type KnownExtensionPointURIs =
   keyof ExtensionPointURItoExtensionIdURItoKind & string

export type KnownExtensionIds<ExtensionPoint extends KnownExtensionPointURIs> =
   keyof ExtensionPointURItoExtensionIdURItoKind[ExtensionPoint] & string

export type KnownExtensionIdURIs<
   ExtensionPoint extends KnownExtensionPointURIs = KnownExtensionPointURIs,
> = KnownExtensionPointURIs extends infer EP extends ExtensionPoint
   ? KnownExtensionIds<EP> extends infer ExtensionId extends string
      ? NamespaceURI<EP, ExtensionId>
      : never
   : never

// 2. Extract valid URIs from whatever gets registered
type ExtensionPayloadTypeURIs<ExtensionPoint extends string> = {
   [K in NamespaceURI<ExtensionPoint, string> &
      keyof ExtensionPayloadTypeURItoKind]: K
}[NamespaceURI<ExtensionPoint, string> & keyof ExtensionPayloadTypeURItoKind]

type ExtensionTArgsURIs<ExtensionPoint extends string> = {
   [K in NamespaceURI<ExtensionPoint, string> &
      keyof ExtensionTArgsURItoKind]: K
}[NamespaceURI<ExtensionPoint, string> & keyof ExtensionTArgsURItoKind]

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

export type KnownExtensionClassIds<ExtensionPoint extends string> =
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

export interface IExtensionKey<
   in out ExtensionPoint extends string,
   in out ExtensionId extends KnownExtensionClassIds<ExtensionPoint>,
> {
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}

// IExtensionClass models the constructor and static fields of any extension class
export interface ExtensionClassKind<
   in out ExtensionPoint extends string,
   in out ExtensionId extends KnownExtensionClassIds<ExtensionPoint>,
> extends Function {
   // Constructor signature
   new (
      ...args: TArgsKind<ExtensionPoint, ExtensionId>
   ): PayloadTypeKind<ExtensionPoint, ExtensionId>
   // Static properties required for registration
   extensionFor: ExtensionPoint
   extensionId: ExtensionId
}
