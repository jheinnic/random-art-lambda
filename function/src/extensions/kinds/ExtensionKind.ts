import { StringKeys } from "simplytyped"
import {
   ToExtTArgsKind,
   ToExtPayloadKind,
   ToExtStaticBodyKind,
   ToExtAdaptersRefKind,
   ToExtensionsRefKind,
} from "./ExtensionPointKind.js"
import type { GenModelExtensions } from "../../seeding/kinds/GenModelSeedModule.js"
import { HexSeedExtension } from "../../seeding/builtin/components/HexSeedExtension.js"
import { Type } from "@nestjs/common"

/**
 * Any extension point that has specified all its extension requirements will find
 * its key listed in this union.
 */
export type KnownExtensionPointIds = StringKeys<ToExtPayloadKind<string>> &
   StringKeys<ToExtTArgsKind<string>> &
   StringKeys<ToExtStaticBodyKind<string>> &
   StringKeys<ToExtAdaptersRefKind<string>> &
   StringKeys<ToExtensionsRefKind>

export type CandidateExtensionIds<
   ExtensionPoint extends KnownExtensionPointIds,
> = StringKeys<ToExtensionsRefKind[ExtensionPoint]>

export type ExtensionPayloadKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = ToExtPayloadKind<ExtensionId>[ExtensionPoint]

export type ExtensionTArgsKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = ToExtTArgsKind<ExtensionId>[ExtensionPoint]

export type ExtensionStaticBodyKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = ToExtStaticBodyKind<ExtensionId>[ExtensionPoint]

export type ExtensionValidityRequirements<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = {
   new (
      ...args: ExtensionTArgsKind<ExtensionPoint, ExtensionId>
   ): ExtensionPayloadKind<ExtensionPoint, ExtensionId>
   readonly extensionFor: ExtensionPoint
   readonly extensionId: ExtensionId
} & Omit<
   ExtensionStaticBodyKind<ExtensionPoint, ExtensionId>,
   "extensionFor" | "extensionId"
>

export type ExtensionValidityTest<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> =
   Type<
      ToExtensionsRefKind[ExtensionPoint][ExtensionId]
   > extends ExtensionValidityRequirements<ExtensionPoint, ExtensionId>
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
> = ToExtensionsRefKind[ExtensionPoint][ExtensionId]

// export type ExtensionPointToExtensionKinds = {
//    [ExtensionPoint in KnownExtensionPointIds]: {
//       [ExtensionId in KnownExtensionIds<ExtensionPoint>]: ExtensionClassKind<
//          ExtensionPoint,
//          ExtensionId
//       >
//    }
// }
