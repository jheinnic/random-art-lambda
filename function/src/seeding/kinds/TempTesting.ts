import {
   ExtensionValidityTest,
   ExtensionClassKind,
   KnownExtensionIds,
   ExtensionValidityRequirements,
   CandidateExtensionIds,
} from "../../extensions/kinds/ExtensionKind.js"
import { ToExtensionsRefKind } from "../../extensions/kinds/ExtensionPoints.js"
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
type OJj = ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["HexSeed"]
type Mhb = ToExtensionsRefKind[GEN_MODEL_SEED_EXTENSION_POINT]["PhraseSeed"]

export const Klo: OJj = HexSeedExtension
export const Owo: Mhb = PhraseSeedExtension
export const Kla: pkw = HexSeedExtension
export const Owa: obn = PhraseSeedExtension

export const jsw = new Klo()

export const Gluk: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
> = Owa

export const gsk = new Gluk()

export const Pluk: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
> = Owo

export const psk = new Pluk()

export const Sluk: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "PhraseSeed"
> = PhraseSeedExtension

export const ssk = new Sluk()

export const Gwot: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
> = Kla

export const gtg = new Gwot()

export const Pwot: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
> = Klo

export const ptg = new Pwot()

export const Swot: ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   "HexSeed"
> = HexSeedExtension

export const stg = new Swot()
