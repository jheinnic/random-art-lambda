import "./GenModelSeedExtensionKind.js"

import { ToExtensionsRefKind } from "../../extensions/kinds/ExtensionPointKind.js"
import {
   CandidateExtensionIds,
   ExtensionValidityRequirements,
   ExtensionValidityTest,
} from "../../extensions/kinds/ExtensionKind.js"
import {
   ExtensionClassKind,
   KnownExtensionIds,
} from "../../extensions/kinds/index.js"

import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"
import { SeedByExtension } from "../models/SeedByExtension.js"
import { Type } from "@nestjs/common"

// This type locks the ExtensionPoint AND the Instance type
export type KnownGenModelSeedExtensionIds =
   KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>

// export type KnownGenModelSeedPayloadIds =
//    KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>

// export type KnownGenModelSeedAdapterIds =
//    KnownExtensionAdapterIds<GEN_MODEL_SEED_EXTENSION_POINT>

// export type GenModelSeedExtensionKind<
//    ExtensionId extends KnownGenModelSeedExtensionIds,
// > = ExtensionClassKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

// export type GenModelSeedPayloadKind<
//    ExtensionId extends KnownGenModelSeedPayloadIds,
// > = ExtensionPayloadKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

// export type AllGenModelSeedExtensions =
//    GenModelSeedExtensionKind<KnownGenModelSeedExtensionIds>

// export type AllGenModelSeedPayloads =
//    GenModelSeedPayloadKind<KnownGenModelSeedPayloadIds>

export type GenModelSeedKind<
   ExtensionId extends KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
> = ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   ExtensionId
>["seedModelType"] &
   SeedByExtension<ExtensionId>

type SD = ExtensionClassKind<GEN_MODEL_SEED_EXTENSION_POINT, "HexSeed">
type AL = ExtensionClassKind<GEN_MODEL_SEED_EXTENSION_POINT, "PhraseSeed">

type OK = KnownExtensionIds<"GenModelSeed">

type IB = ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["HexSeed"]
type JB = ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["PhraseSeed"]

type pkw = ExtensionValidityRequirements<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
>
type obn = ExtensionValidityRequirements<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
>
type ioj = ExtensionValidityTest<GEN_MODEL_SEED_EXTENSION_POINT, "HexSeed">
type nha = ExtensionValidityTest<GEN_MODEL_SEED_EXTENSION_POINT, "PhraseSeed">

type OJj = ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["HexSeed"]
type Mhb = ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["PhraseSeed"]

type WJj = Type<ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["HexSeed"]>
type Nhb = Type<
   ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["PhraseSeed"]
>

export const klo: WJj = { extensionId: 5 }
export const owj: Nhb = { extensionId: 45 }

export type Isit<
   A extends CandidateExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
   B extends ExtensionValidityTest<GEN_MODEL_SEED_EXTENSION_POINT, A>,
> = number

export type POo = number

export type Lkw = Isit<"HexSeed", pkw>
export type Dkw = Isit<"PhraseSeed", obn>
