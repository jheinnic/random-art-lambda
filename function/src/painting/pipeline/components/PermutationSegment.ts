/**
 * PermutationSegment — config-expression segment helper.
 *
 * Adds a `transcodedTerms` public feature that re-encodes the binary prefix
 * and suffix buffers (from initial context) to the resolved encoding.
 * Also declares a virtual `appTerms` contract for application-specific term
 * enrichment.
 *
 * Precondition: createEncodingSegment must have been applied first so that
 * `originalEncoding` is present in the builder's context.
 */

import type { ConfigService } from "@nestjs/config"
import { createSegmentBlueprint } from "../../../pipeline/index.js"
import type { OriginalEncoding } from "./EncodingSegment.js"

/** Transcoded term strings produced by this segment. */
export interface TranscodedTerms {
   prefix: string
   suffix: string
}

/** Virtual contract for application-supplied term enrichment. */
export interface AppCustomTerms {
   selected: string | null
}

type TermsSelectors = {
   prefix: readonly ["prefix", "originalEncoding"]
   suffix: readonly ["suffix", "originalEncoding"]
}

type TermsRequiredAC = OriginalEncoding & {
   prefix: Uint8ClampedArray
   suffix: Uint8ClampedArray
}

const termProperties = {
   prefix: {
      method: (bin: Uint8ClampedArray, enc: BufferEncoding) =>
         Buffer.from(bin.buffer).toString(enc),
      selectors: ["prefix", "originalEncoding"] as const,
   },
   suffix: {
      method: (bin: Uint8ClampedArray, enc: BufferEncoding) =>
         Buffer.from(bin.buffer).toString(enc),
      selectors: ["suffix", "originalEncoding"] as const,
   },
}

// Placeholder blueprint used only to derive the helper's type signature.
const _permutationBlueprint = createSegmentBlueprint()
   .requiresInContext<TermsRequiredAC>()
   .addPublicFeature<TranscodedTerms, "transcodedTerms", TermsSelectors>(
      "transcodedTerms",
      termProperties,
   )
   .addVirtualFeature<AppCustomTerms, "appTerms">("appTerms")

export type PermutationSegmentHelper = ReturnType<
   typeof _permutationBlueprint.buildHelper
>

// ConfigService accepted for API consistency; no keys read currently.
export function createPermutationSegment(
   _configSvc: ConfigService,
): PermutationSegmentHelper {
   return createSegmentBlueprint()
      .requiresInContext<TermsRequiredAC>()
      .addPublicFeature<TranscodedTerms, "transcodedTerms", TermsSelectors>(
         "transcodedTerms",
         termProperties,
      )
      .addVirtualFeature<AppCustomTerms, "appTerms">("appTerms")
      .buildHelper()
}
