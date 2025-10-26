import { StringKeys } from "simplytyped"
import {
   KnownExtensionPointIds,
   ToExtensionsRefKind,
   ToExtensionTArgsKind,
   ToPayloadKind,
   ToStaticBodyKind,
} from "./ExtensionPointKind.js"
import type { GenModelExtensions } from "../../seeding/kinds/GenModelSeedModule.js"
import { HexSeedExtension } from "../../seeding/builtin/components/HexSeedExtension.js"

type CandidateExtensionIds<ExtensionPoint extends KnownExtensionPointIds> =
   StringKeys<ToExtensionsRefKind[ExtensionPoint]>

export type ExtensionValidityRequirements<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> = {
   new (
      ...args: ToExtensionTArgsKind<ExtensionId>[ExtensionPoint]
   ): ToPayloadKind<ExtensionId>[ExtensionPoint]
   readonly extensionFor: ExtensionPoint
   readonly extensionId: ExtensionId
} & Omit<
   ToStaticBodyKind<ExtensionId>[ExtensionPoint],
   "extensionFor" | "extensionId"
>

type ExtensionValidityTest<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends CandidateExtensionIds<ExtensionPoint>,
> =
   ToExtensionsRefKind[ExtensionPoint][ExtensionId] extends ExtensionValidityRequirements<
      ExtensionPoint,
      ExtensionId
   >
      ? ExtensionId
      : never

type LoP = ToExtensionsRefKind["GenModelSeed"]["HexSeed"]
type PP = ExtensionValidityTest<"GenModelSeed", "HexSeed">

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

export type ExtensionPayloadKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = InstanceType<ExtensionClassKind<ExtensionPoint, ExtensionId>>

export type ExtensionTArgsKind<
   ExtensionPoint extends KnownExtensionPointIds,
   ExtensionId extends KnownExtensionIds<ExtensionPoint>,
> = ConstructorParameters<ExtensionClassKind<ExtensionPoint, ExtensionId>>

export type ExtensionPointToExtensionKinds = {
   [ExtensionPoint in KnownExtensionPointIds]: {
      [ExtensionId in KnownExtensionIds<ExtensionPoint>]: ExtensionClassKind<
         ExtensionPoint,
         ExtensionId
      >
   }
}

export type LEK = ExtensionClassKind<
   "GenModelSeed",
   "HexSeed" | "PhraseSeed"
   // KnownExtensionIds<"GenModelSeed">
>

export type LKW = KnownExtensionIds<"GenModelSeed">
export type KWJ = keyof ToExtensionsRefKind["GenModelSeed"]
export type MJJ = keyof GenModelExtensions
export const skJJ: any = {
   HexSeed: HexSeedExtension,
   PhraseSeed: HexSeedExtension,
}
export interface FSHHj {
   new (...args: any[]): any
   lidfas: nunber
}

export const ABN = new GenModelExtensions.HexSeed("abcd")
// export let JWO: FSHHj
export let JWO: ExtensionClassKind<"GenModelSeed", "HexSeed">
export const rr = HexSeedExtension
JWO = rr
JWO = HexSeedExtension
JWO = typeof HexSeedExtension
export const ABN = new HexSeedExtension("abcd")

JWO = rr
