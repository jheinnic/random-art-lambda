/**
 * EncodingSegment — config-expression segment helper.
 *
 * Extends the pipeline initial context with a default `originalEncoding`
 * value (read from ConfigService) and declares a virtual `encodingOverride`
 * contract so applications can supply an expression-driven override.
 *
 * No prerequisites — uses createSegmentBlueprint() directly.
 */

import {
   createPipeline,
   createSegmentBlueprintFromBuilder,
} from "../../../pipeline/index.js"
import { TaskTermEncoding } from "../values/TaskTermEncoding.js"
import { createArtworkEngineSegment } from "./ArtworkEngineSegment.js"
import { EncodedTerms } from "../values/EncodedTerms.js"

/**
 * The resolved encoding: encodingOverride.selected if present and non-null,
 * otherwise originalEncoding.  Always concrete — downstream segments should
 * select this rather than originalEncoding directly.
 */
export interface ResolvedEncoding {
   selected: BufferEncoding
}
const termProperties = {
   systemPrefixString: {
      method: (bin: Uint8ClampedArray) =>
         Buffer.from(bin.buffer).toString("base64url"),
      selectors: ["seedPrefix"] as const,
   },
   systemSuffixString: {
      method: (bin: Uint8ClampedArray) =>
         Buffer.from(bin.buffer).toString("base64url"),
      selectors: ["seedSuffix"] as const,
   },
   appPrefixString: {
      method: (bin: Uint8ClampedArray, enc: BufferEncoding) =>
         Buffer.from(bin.buffer).toString(enc),
      selectors: [
         "seedPrefix",
         ["taskTermEncoding", "encoding"] as const,
      ] as const,
   },
   appSuffixString: {
      method: (bin: Uint8ClampedArray, enc: BufferEncoding) =>
         Buffer.from(bin.buffer).toString(enc),
      selectors: [
         "seedSuffix",
         ["taskTermEncoding", "encoding"] as const,
      ] as const,
   },
}

export const SELECT_TOKENS_MAP = {
   systemPrefixString: ["seedPrefix"],
   systemSuffixString: ["seedSuffix"],
   appPrefixString: ["seedPrefix", ["taskTermEncoding", "encoding"]],
   appSuffixString: ["seedSuffix", ["taskTermEncoding", "encoding"]],
} as const

const witness = createArtworkEngineSegment(createPipeline())

// Placeholder blueprint used only to derive the helper's return type.
const _encodingBlueprint = createSegmentBlueprintFromBuilder(witness)
   .addVirtualFeature<TaskTermEncoding, "taskTermEncoding">("taskTermEncoding")
   .addPublicFeature<
      EncodedTerms,
      "encodedTerms",
      typeof SELECT_TOKENS_MAP
   >("encodedTerms", termProperties)

export type EncodingSegmentHelper = ReturnType<
   typeof _encodingBlueprint.buildHelper
>

export const createEncodingSegment: EncodingSegmentHelper =
   _encodingBlueprint.buildHelper()
