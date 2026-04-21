/**
 * ArtworkEngine — config-expression segment helper.
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

import { createSegmentBlueprint } from "../../../pipeline/segment.js"
import { PaintedTask } from "../values/PaintedTask.js"

// Placeholder blueprint built from the witness, used only to derive the
// exported helper type via ReturnType.
const artworkEngineBlueprint =
   createSegmentBlueprint().extendInitial<PaintedTask>({})

export type ArtworkEngineSegmentHelper = ReturnType<
   typeof artworkEngineBlueprint.buildHelper
>

export const createArtworkEngineSegment: ArtworkEngineSegmentHelper =
   artworkEngineBlueprint.buildHelper()
