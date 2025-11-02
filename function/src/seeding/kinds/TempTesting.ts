import {
   ExtensionValidityTest,
   ExtensionClassKind,
   KnownExtensionIds,
   ExtensionValidityRequirements,
   CandidateExtensionIds,
} from "../../extensions/kinds/ExtensionKind.js"
import { PointForPointForExtensions } from "../../extensions/kinds/ExtensionPoints.js"
import { HexSeedExtension } from "../builtin/components/HexSeedExtension.js"
import { PhraseSeedExtension } from "../builtin/components/PhraseSeedExtension.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"

export type IK = CandidateExtensionIds<"GenModelSeed">
export type OK = KnownExtensionIds<"GenModelSeed">

export type ioj = ExtensionValidityTest<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
>
export type nha = ExtensionValidityTest<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
>

export type oia = ExtensionValidityTest<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed" | "HexSeed"
>

export type vub =
   | ExtensionValidityTest<GEN_MODEL_SEED_EXTENSION_POINT, "HexSeed">
   | ExtensionValidityTest<GEN_MODEL_SEED_EXTENSION_POINT, "PhraseSeed">

type pkw = ExtensionValidityRequirements<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
>
type obn = ExtensionValidityRequirements<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
>
type OJj = PointForPointForExtensions[GEN_MODEL_SEED_EXTENSION_POINT]["HexSeed"]
type Mhb =
   PointForPointForExtensions[GEN_MODEL_SEED_EXTENSION_POINT]["PhraseSeed"]

export const Klo: OJj = HexSeedExtension
export const Owo: Mhb = PhraseSeedExtension
export const Kla: pkw = HexSeedExtension
export const Owa: obn = PhraseSeedExtension

export const jsw = new Klo()

export const Glue: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
> = Owa

export const gsk = new Glue()

export const Plum: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
> = Owo

export const psk = new Plum()

export const Slur: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
> = PhraseSeedExtension

export const ssk = new Slur()

export const Gnat: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
> = Kla

export const gtg = new Gnat()

export const Prat: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
> = Klo

export const ptg = new Prat()

export const Slat: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
> = HexSeedExtension

export const stg = new Slat()
