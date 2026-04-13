/**
 * PermutationSegment — config-expression segment helper.
 *
 * Adds a `transcodedTerms` public feature that re-encodes the binary prefix
 * and suffix buffers (from initial context) to the resolved encoding.
 * Also declares a virtual `appTerms` contract for application-specific term
 * enrichment.
 *
 * Prerequisites expressed via witness chain through createEncodingSegment:
 *   - originalEncoding (BufferEncoding) — concrete after EncodingSegment
 *   - prefix (Uint8ClampedArray) — from pipeline initial context
 *   - suffix (Uint8ClampedArray) — from pipeline initial context
 */

import type { ConfigService } from "@nestjs/config"
import {
   createPipeline,
   createSegmentBlueprintFromBuilder,
} from "../../../pipeline/index.js"
import { createEncodingSegment } from "./EncodingSegment.js"

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
   prefix: readonly ["prefix", readonly ["resolvedEncoding", "selected"]]
   suffix: readonly ["suffix", readonly ["resolvedEncoding", "selected"]]
}

/** Minimal initial context needed to build the prerequisite witness. */
interface PermutationMinimalIC {
   prefix: Uint8ClampedArray
   suffix: Uint8ClampedArray
}

const termProperties = {
   prefix: {
      method: (bin: Uint8ClampedArray, enc: BufferEncoding) =>
         Buffer.from(bin.buffer).toString(enc),
      selectors: [
         "prefix",
         ["resolvedEncoding", "selected"] as const,
      ] as const,
   },
   suffix: {
      method: (bin: Uint8ClampedArray, enc: BufferEncoding) =>
         Buffer.from(bin.buffer).toString(enc),
      selectors: [
         "suffix",
         ["resolvedEncoding", "selected"] as const,
      ] as const,
   },
}

// Witness: a minimal builder advanced through the prerequisites of this segment.
// Used only for type extraction — its runtime value is discarded.
const _witness = createEncodingSegment({ get: () => undefined } as unknown as ConfigService)(
   createPipeline<PermutationMinimalIC>(),
)

// Placeholder blueprint built from the witness, used only to derive the
// exported helper type via ReturnType.
const _permutationBlueprint = createSegmentBlueprintFromBuilder(_witness)
   .addPublicFeature<TranscodedTerms, "transcodedTerms", TermsSelectors>(
      "transcodedTerms",
      termProperties,
   )
   .addVirtualFeature<AppCustomTerms, "appTerms">("appTerms")

export type PermutationSegmentHelper = ReturnType<
   typeof _permutationBlueprint.buildHelper
>

export function createPermutationSegment(
   configSvc: ConfigService,
): PermutationSegmentHelper {
   // Witness chain: advance a minimal builder through this segment's prerequisites.
   const witness = createEncodingSegment(configSvc)(
      createPipeline<PermutationMinimalIC>(),
   )

   return createSegmentBlueprintFromBuilder(witness)
      .addPublicFeature<TranscodedTerms, "transcodedTerms", TermsSelectors>(
         "transcodedTerms",
         termProperties,
      )
      .addVirtualFeature<AppCustomTerms, "appTerms">("appTerms")
      .buildHelper()
}
