import { StringKeys } from "simplytyped"
import {
   INDIRECT,
   HooksForExtTArgs,
   HooksForExtPayload,
   HooksForExtStaticPayload,
   HooksForHooksForAdapterFactory,
   HooksForHooksForExtensionClasses,
} from "./ExtPointHooks.js"

interface DelegatedEntry<N extends object> {
   [INDIRECT]: N
}

/**
 * Any extension point that has specified all its extension requirements will find
 * its key listed in this union.
 */
export type KnownExtensionPointIds = StringKeys<HooksForExtPayload<string>> &
   StringKeys<HooksForExtTArgs<string>> &
   StringKeys<HooksForExtStaticPayload<string>> &
   StringKeys<HooksForHooksForAdapterFactory<string>> &
   StringKeys<HooksForHooksForExtensionClasses>

export type CandidateExtensionIds<
   ExtensionPoint extends KnownExtensionPointIds,
> = StringKeys<HooksForHooksForExtensionClasses[ExtensionPoint]>

export type ExtensionPayloadKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> =
   HooksForExtPayload<ExtensionId>[ExtensionPoint] extends DelegatedEntry<
      infer N
   >
      ? N[ExtensionId & keyof N]
      : HooksForExtPayload<ExtensionId>[ExtensionPoint]

export type ExtensionTArgsKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> =
   HooksForExtTArgs<ExtensionId>[ExtensionPoint] extends DelegatedEntry<infer N>
      ? N[ExtensionId & keyof N]
      : HooksForExtTArgs<ExtensionId>[ExtensionPoint]

export type ExtensionStaticBodyKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = Omit<
   HooksForExtStaticPayload<ExtensionId>[ExtensionPoint] extends DelegatedEntry<
      infer N
   >
      ? N[ExtensionId & keyof N]
      : HooksForExtStaticPayload<ExtensionId>[ExtensionPoint],
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
type ExtensionValidityRequirements<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = {
   new (
      ...args: ExtensionTArgsKind<ExtensionPoint, ExtensionId>
   ): ExtensionPayloadKind<ExtensionPoint, ExtensionId>
   readonly extensionFor: ExtensionPoint
   readonly extensionId: ExtensionId
} & ExtensionStaticBodyKind<ExtensionPoint, ExtensionId>

type ExtensionValidityTest<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> =
   HooksForHooksForExtensionClasses[ExtensionPoint][ExtensionId] extends ExtensionValidityRequirements<
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

export type ExtensionClassKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = {
   [K in ExtensionId]: HooksForHooksForExtensionClasses[ExtensionPoint][K] &
      ExtensionValidityRequirements<ExtensionPoint, K>
}[ExtensionId]
