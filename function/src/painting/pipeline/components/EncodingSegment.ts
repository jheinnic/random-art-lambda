/**
 * EncodingSegment — config-expression segment helper.
 *
 * Extends the pipeline initial context with a default `originalEncoding`
 * value (read from ConfigService) and declares a virtual `encodingOverride`
 * contract so applications can supply an expression-driven override.
 */

import type { ConfigService } from "@nestjs/config"
import { createSegmentBlueprint } from "../../../pipeline/index.js"

/** The encoding value placed into initial context. */
export interface OriginalEncoding {
   originalEncoding: BufferEncoding
}

/** Contract an application may fulfill to override the default encoding. */
export interface EncodingOverride {
   selected: BufferEncoding | null
}

// Placeholder blueprint used only to derive the helper's type signature.
// Runtime values do not affect the type — only the shape matters.
const _encodingBlueprint = createSegmentBlueprint()
   .extendInitial({ originalEncoding: "utf8" as BufferEncoding })
   .addVirtualFeature<EncodingOverride, "encodingOverride">("encodingOverride")

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
      .addVirtualFeature<
         EncodingOverride,
         "encodingOverride"
      >("encodingOverride")
      .buildHelper()
}
