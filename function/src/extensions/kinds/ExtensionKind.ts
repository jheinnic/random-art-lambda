import { StringKeys } from "simplytyped"
import {
   PointForExtTArgs,
   PointForExtPayload,
   PointForExtStaticPayload,
   PointForPointForAdapterFactory,
   PointForPointForExtensions,
} from "../../extensions/kinds/ExtensionPoints.js"

/**
 * Any extension point that has specified all its extension requirements will find
 * its key listed in this union.
 */
export type KnownExtensionPointIds = StringKeys<PointForExtPayload<string>> &
   StringKeys<PointForExtTArgs<string>> &
   StringKeys<PointForExtStaticPayload<string>> &
   StringKeys<PointForPointForAdapterFactory<string>> &
   StringKeys<PointForPointForExtensions>

export type CandidateExtensionIds<
   ExtensionPoint extends KnownExtensionPointIds,
> = StringKeys<PointForPointForExtensions[ExtensionPoint]>

export type ExtensionPayloadKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = PointForExtPayload<ExtensionId>[ExtensionPoint]

export type ExtensionTArgsKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = PointForExtTArgs<ExtensionId>[ExtensionPoint]

export type ExtensionStaticBodyKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = Omit<
   PointForExtStaticPayload<ExtensionId>[ExtensionPoint],
   "extensionFor" | "extensionId"
>

/**
 * Captures most of the type requirements of an extension class kind, but it is unable to correctly accommodate
 * type extensions from an extension itself, so we cannot simply use this definition to directly implement the
 * ExtensionClassKind type.
 *
 * For example, the "GenModel Seed" extension requires that extension providers register and use an additional
 * member of its distributed union that uses the extension ID as a discriminator key.   This validator can
 * assert that the contributed class includes use of a type that satisfies the existence of the discriminator key,
 * but it cannot accommodate the remainder of its definition that is registered because that would require
 * knowledge of the extensible interface module defined within the extension for capturing this subtype declaration.
 *
 * If we
 */
export type ExtensionValidityRequirements<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = {
   new (
      ...args: ExtensionTArgsKind<ExtensionPoint, ExtensionId>
   ): ExtensionPayloadKind<ExtensionPoint, ExtensionId>
   readonly extensionFor: ExtensionPoint
   readonly extensionId: ExtensionId
} & ExtensionStaticBodyKind<ExtensionPoint, ExtensionId>

export type ExtensionValidityTest<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> =
   PointForPointForExtensions[ExtensionPoint][ExtensionId] extends ExtensionValidityRequirements<
      ExtensionPoint,
      ExtensionId
   >
      ? ExtensionId
      : never

export type KnownExtensionIds<ExtensionPoint extends KnownExtensionPointIds> = {
   [ExtensionId in CandidateExtensionIds<ExtensionPoint>]: ExtensionValidityTest<
      ExtensionPoint,
      ExtensionId
   >
}[CandidateExtensionIds<ExtensionPoint>]

// export type KnownExtensionIds<ExtensionPoint extends KnownExtensionPointIds> =
//    ExtensionValidityTest<ExtensionPoint, CandidateExtensionIds<ExtensionPoint>>

export type ExtensionClassKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = {
   [K in ExtensionId]: PointForPointForExtensions[ExtensionPoint][K] &
      ExtensionValidityRequirements<ExtensionPoint, K>
}[ExtensionId]

// export type ExtensionPointToExtensionKinds = {
//    [ExtensionPoint in KnownExtensionPointIds]: {
//       [ExtensionId in KnownExtensionIds<ExtensionPoint>]: ExtensionClassKind<
//          ExtensionPoint,
//          ExtensionId
//       >
//    }
// }
