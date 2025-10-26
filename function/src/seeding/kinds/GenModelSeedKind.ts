import {
   ExtensionPayloadKind,
   ExtensionClassKind,
   KnownExtensionIds,
} from "../../extensions/kinds/index.js"
import { KnownExtensionAdapterIds } from "../../extensions/kinds/ExtensionAdapterKind.js"
import { GEN_MODEL_SEED_EXTENSION_POINT } from "./Constants.js"

// This type locks the ExtensionPoint AND the Instance type
// export type KnownGenModelSeedExtensionIds =
//    KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>

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
   ExtensionId extends string, // KnownExtensionIds<GEN_MODEL_SEED_EXTENSION_POINT>,
> = ExtensionClassKind<
   GEN_MODEL_SEED_EXTENSION_POINT,
   ExtensionId
>["seedModelType"]

type SD = ExtensionClassKind<GEN_MODEL_SEED_EXTENSION_POINT, "IHexSeed">
