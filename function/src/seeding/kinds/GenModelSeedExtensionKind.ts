import {
   KnownPayloadIds,
   PayloadTypeKind,
   ExtensionClassKind,
   KnownExtensionClassIds,
} from "../../extensions/kinds/ExtensionClassKind.js"
import { KnownExtensionAdapterIds } from "../../extensions/kinds/ExtensionAdapterKind.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"

// This type locks the ExtensionPoint AND the Instance type
export type KnownGenModelSeedExtensionIds =
   KnownExtensionClassIds<GEN_MODEL_SEED_EXTENSION_POINT>

export type KnownGenModelSeedPayloadIds =
   KnownPayloadIds<GEN_MODEL_SEED_EXTENSION_POINT>

export type KnownGenModelSeedAdapterIds =
   KnownExtensionAdapterIds<GEN_MODEL_SEED_EXTENSION_POINT>

export type GenModelSeedExtensionKind<
   ExtensionId extends KnownGenModelSeedExtensionIds,
> = ExtensionClassKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

export type GenModelSeedPayloadKind<
   ExtensionId extends KnownGenModelSeedPayloadIds,
> = PayloadTypeKind<GEN_MODEL_SEED_EXTENSION_POINT, ExtensionId>

export type AllGenModelSeedExtensions =
   GenModelSeedExtensionKind<KnownGenModelSeedExtensionIds>

export type AllGenModelSeedPayloads =
   GenModelSeedPayloadKind<KnownGenModelSeedPayloadIds>
