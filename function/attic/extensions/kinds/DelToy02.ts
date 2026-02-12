import { StringKeys } from "simplytyped"
import { Catalog, INDIRECT, Industry } from "./DelToy01.js"

export interface DelegatedEntry<N extends object> {
   [INDIRECT]: N
}

export type KnownIndustryIds = StringKeys<Catalog<string>> &
   StringKeys<Industry>

// export type CandidateIndustryCatalogIds<
//    ExtensionPoint extends KnownIndustryIds,
// > =
//    Catalog<string>[ExtensionPoint] extends DelegatedEntry<infer N>
//       ? StringKeys<Catalog<string>[ExtensionPoint][typeof INDIRECT]> // StringKeys<N>
//       : StringKeys<Catalog<string>[ExtensionPoint]>

export type CandidateIndustryCatalogIds<
   ExtensionPoint extends KnownIndustryIds,
> = StringKeys<Industry[ExtensionPoint]>

export type ParticleKind<
   ExtensionPoint extends KnownIndustryIds,
   ExtensionId extends CandidateIndustryCatalogIds<ExtensionPoint>,
> =
   Catalog<ExtensionId>[ExtensionPoint] extends DelegatedEntry<infer N>
      ? N[ExtensionId & keyof N]
      : Catalog<ExtensionId>[ExtensionPoint]

export interface ExtensionValidityRequirements<
   ExtensionPoint extends KnownIndustryIds,
   ExtensionId extends CandidateIndustryCatalogIds<ExtensionPoint>,
> {
   new (...args: any[]): ParticleKind<ExtensionPoint, ExtensionId>
   readonly extensionFor: ExtensionPoint
   readonly extensionId: ExtensionId
}

export type ExtensionValidityTest<
   ExtensionPoint extends KnownIndustryIds,
   ExtensionId extends CandidateIndustryCatalogIds<ExtensionPoint>,
> =
   Industry[ExtensionPoint][ExtensionId] extends ExtensionValidityRequirements<
      ExtensionPoint,
      ExtensionId
   >
      ? ExtensionId
      : never

export type KnownIndustryCatalogIds<ExtensionPoint extends KnownIndustryIds> = {
   [ExtensionId in CandidateIndustryCatalogIds<ExtensionPoint>]: ExtensionValidityTest<
      ExtensionPoint,
      ExtensionId
   >
}[CandidateIndustryCatalogIds<ExtensionPoint>]

export type ExtensionClassKind<
   ExtensionPoint extends KnownIndustryIds,
   ExtensionId extends KnownIndustryCatalogIds<ExtensionPoint>,
> = {
   [K in ExtensionId]: Industry[ExtensionPoint][K] &
      ExtensionValidityRequirements<ExtensionPoint, K>
}[ExtensionId]
