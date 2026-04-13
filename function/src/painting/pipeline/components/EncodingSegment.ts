/**
 * EncodingSegment — config-expression segment helper.
 *
 * Extends the pipeline initial context with a default `originalEncoding`
 * value (read from ConfigService) and declares a virtual `encodingOverride`
 * contract so applications can supply an expression-driven override.
 *
 * No prerequisites — uses createSegmentBlueprint() directly.
 */

import type { ConfigService } from "@nestjs/config"
import { createSegmentBlueprint } from "../../../pipeline/index.js"

/** The raw default encoding placed into initial context by this segment. */
export interface OriginalEncoding {
   originalEncoding: BufferEncoding
}

/** Virtual contract an application may fulfill to override the default encoding. */
export interface EncodingOverride {
   selected: BufferEncoding | null
}

/**
 * The resolved encoding: encodingOverride.selected if present and non-null,
 * otherwise originalEncoding.  Always concrete — downstream segments should
 * select this rather than originalEncoding directly.
 */
export interface ResolvedEncoding {
   selected: BufferEncoding
}

// Expression that resolves the encoding with fallback.
// jse-eval returns undefined for missing context keys, so the ternary safely
// short-circuits to originalEncoding when encodingOverride is unfulfilled.
const RESOLVE_ENCODING_EXPR =
   "encodingOverride != null && encodingOverride.selected != null" +
   " ? encodingOverride.selected : originalEncoding"

// Placeholder blueprint used only to derive the helper's return type.
const _encodingBlueprint = createSegmentBlueprint()
   .extendInitial({ originalEncoding: "utf8" as BufferEncoding })
   .addVirtualFeature<EncodingOverride, "encodingOverride">("encodingOverride")
   .addPublicFeature<ResolvedEncoding, "resolvedEncoding">("resolvedEncoding", {
      selected: RESOLVE_ENCODING_EXPR,
   })

export type EncodingSegmentHelper = ReturnType<
   typeof _encodingBlueprint.buildHelper
>

export function createEncodingSegment(
   configSvc: ConfigService,
): EncodingSegmentHelper {
   const defaultEncoding =
      configSvc.get<BufferEncoding>("encoding.defaultEncoding") ?? "utf8"

   return createSegmentBlueprint()
      .extendInitial({ originalEncoding: defaultEncoding })
      .addVirtualFeature<EncodingOverride, "encodingOverride">(
         "encodingOverride",
      )
      .addPublicFeature<ResolvedEncoding, "resolvedEncoding">(
         "resolvedEncoding",
         {
            selected: RESOLVE_ENCODING_EXPR,
         },
      )
      .buildHelper()
}
