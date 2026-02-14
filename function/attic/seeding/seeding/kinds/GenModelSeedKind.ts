import "./GenModelSeedExtension.js"

import {
   CandidateExtensionIds,
   ExtensionPayloadKind,
   ExtensionStaticBodyKind,
   ExtensionTArgsKind,
   ExtensionClassKind,
   KnownExtensionIds,
} from "../../extensions/kinds/index.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"
import { ToGMSeedExtClassKind } from "./GenModelSeedModule.js"

// This type locks the ExtensionPoint AND the Instance type
export type KnownGenModelSeedExtensionIds =
   KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>

export type CandidateGenModelSeedExtensionIds =
   CandidateExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>

export type GMSeedExtClassKind<
   ExtensionId extends KnownGenModelSeedExtensionIds,
> = ExtensionClassKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

export type GMSeedExtPayloadKind<
   ExtensionId extends CandidateGenModelSeedExtensionIds,
> = ExtensionPayloadKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

export type GMSeedExtTArgsKind<
   ExtensionId extends CandidateGenModelSeedExtensionIds,
> = ExtensionTArgsKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

export type GMSeedExtStaticBodyKind<
   ExtensionId extends CandidateGenModelSeedExtensionIds,
> = ExtensionStaticBodyKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

// export type AllGenModelSeedExtensions =
//    GMSeedExtKind<KnownGenModelSeedExtensionIds>

// export type AllGenModelSeedPayloads =
//    GenModelSeedPayloadKind<KnownGenModelSeedPayloadIds>

// export type GMSeedExtModelKind1<
//    ExtensionId extends CandidateExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
// > =
//    ExtensionId extends StringKeys<ToGMSeedExtModelKind>
//       ? ToGMSeedExtModelKind[ExtensionId]
//       : SeedByExtension<ExtensionId>

export type GMSeedExtModelKind<
   ExtensionId extends CandidateExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
> = Parameters<
   InstanceType<ToGMSeedExtClassKind[ExtensionId]>["toSeedModel"]
>[0]
