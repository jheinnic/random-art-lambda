import { StringKeys } from "simplytyped"
import { Catalog, INDIRECT } from "./DelToy01.js"
import {
   CandidateIndustryCatalogIds,
   DelegatedEntry,
   ExtensionValidityRequirements,
   ExtensionValidityTest,
   KnownIndustryCatalogIds,
   KnownIndustryIds,
} from "./DelToy02"
import "./DelToy_05_A1.js"
import "./DelToy_05_B1.js"
import { BakeryCatalog, DealerCatalog } from "./DelToy05_B1.js"
import { StandardBlenders, StandardNotebooks } from "./DelToy05_A1.js"

export type Koo = KnownIndustryIds

export type Dot = CandidateIndustryCatalogIds<"Conforming">
export type Dog = KnownIndustryCatalogIds<"Conforming">

export type Zot = CandidateIndustryCatalogIds<"Innovating">
export type Zog = KnownIndustryCatalogIds<"Innovating">

export type Lkj<ExtensionPoint extends KnownIndustryIds> =
   Catalog<string>[ExtensionPoint] extends DelegatedEntry<infer N>
      ? N
      : Catalog<string>[ExtensionPoint]
export type P1 = Lkj<"Conforming">
export type P2 = Lkj<"Innovating">

export type KJw = StringKeys<Catalog<string>["Conforming"]>
export type Jop<T extends "Innovating" | "Conforming"> =
   Catalog<string>[T] extends DelegatedEntry<infer _N>
      ? StringKeys<Catalog<string>[T][typeof INDIRECT]>
      : StringKeys<Catalog<string>[T]>

export type Pjq = Jop<"Conforming">
export type Pdo = Jop<"Innovating">

export type Jaw =
   Catalog<string>["Innovating" | "Conforming"] extends DelegatedEntry<infer _N>
      ? StringKeys<Catalog<string>["Innovating"][typeof INDIRECT]>
      : StringKeys<Catalog<string>["Conforming"]>

export type Jow =
   Catalog<string>["Innovating" | "Conforming"] extends DelegatedEntry<infer N>
      ? StringKeys<N>
      : StringKeys<Catalog<string>["Conforming"]>

export type Kkr<ExtensionPoint extends KnownIndustryIds> = {
   [ExtensionId in CandidateIndustryCatalogIds<ExtensionPoint>]: ExtensionValidityTest<
      ExtensionPoint,
      ExtensionId
   >
} // [CandidateIndustryCatalogIds<ExtensionPoint>]

export const owi: Kkr<"Conforming"> = {
   Blender: "Blender",
   Notebook: "Notebook",
}

export const kin: Kkr<"Innovating"> = {
   BakedGoods: "BakedGoods",
   AutoParts: "AutoParts",
}

export type Ol1 = ExtensionValidityRequirements<"Conforming", "Blender">
export type Ol2 = ExtensionValidityRequirements<"Conforming", "Notebook">
export type Ol3 = ExtensionValidityRequirements<"Innovating", "BakedGoods">
export type Ol4 = ExtensionValidityRequirements<"Innovating", "AutoParts">

export const isJowi: Ol1 = StandardBlenders
export const isJopi: Ol2 = StandardNotebooks
export const isKawi: Ol3 = BakeryCatalog
export const isKapi: Ol4 = DealerCatalog

// export const nosJowi: Ol2 = StandardBlenders
// export const nosJopi: Ol1 = StandardNotebooks
// export const nosKawi: Ol4 = BakeryCatalog
// export const nosKapi: Ol3 = DealerCatalog

// export const wasJowi: typeof StandardBlenders = isJowi
// export const wasJopi: typeof StandardNotebooks = isJopi
// export const wasKawi: typeof BakeryCatalog = isKawi
// export const wasKapi: typeof DealerCatalog = isKapi

export type Aaa =
   typeof StandardBlenders extends ExtensionValidityRequirements<
      "Conforming",
      "Blender"
   >
      ? 1
      : 2
export type Bab =
   ExtensionValidityRequirements<
      "Conforming",
      "Blender"
   > extends typeof StandardBlenders
      ? 1
      : 2

export type Zl1 = ExtensionValidityTest<"Conforming", "Blender">
export type Zl3 = ExtensionValidityTest<"Innovating", "BakedGoods">
