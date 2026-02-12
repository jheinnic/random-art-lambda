import "./ExtPointPlugins.js"

import { KnownExtensionIds } from "../../../extensions/kinds/index.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"
import { HooksForGMSeedExtensionClass } from "./GenModelSeedHooks.js"

// This type locks the ExtensionPoint AND the Instance type
export type KnownGenModelSeedExtensionIds =
   KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>

export type CandidateGenModelSeedExtensionIds =
   keyof HooksForGMSeedExtensionClass

export type GMSeedExtClassKind<
   ExtensionId extends CandidateGenModelSeedExtensionIds,
> = HooksForGMSeedExtensionClass[ExtensionId]

export type GMSeedExtModelKind<
   ExtensionId extends CandidateGenModelSeedExtensionIds,
> = Parameters<InstanceType<GMSeedExtClassKind<ExtensionId>>["toSeedModel"]>[0]
