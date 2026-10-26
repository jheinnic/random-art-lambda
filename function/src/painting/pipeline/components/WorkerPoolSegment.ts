/**
 * WorkerPoolSegment — code-injecting segment helper.
 *
 * Declares the virtual `stagingStrategy` and `stagedFilePath` contracts and
 * registers the `stagingResult` step.
 *
 * Prerequisites expressed via witness chain:
 *   - originalEncoding (BufferEncoding) — concrete after EncodingSegment
 *   - transcodedTerms (TranscodedTerms)  — concrete after PermutationSegment
 *   - fileStore (IFileStore)             — from addPrivateInjection on the witness
 *   - canvasBuffer (Buffer)              — from pipeline initial context
 *
 * Runtime pruning: if an application never fulfills `stagingStrategy`,
 * the step is skipped and `stagingResult` is absent from the pipeline output.
 */

import type { IFileStore } from "../../../storage/interface/IFileStore.js"
import {
   createPipeline,
   createSegmentBlueprintFromBuilder,
} from "../../../pipeline/index.js"
import { createEncodingSegment } from "./EncodingSegment.js"
import { createArtworkEngineSegment } from "./ArtworkEngineSegment.js"
import { FileStoreSelection } from "../values/FileStoreSelection.js"
import { PathTargetSelection } from "../values/PathTargetSelection.js"
import { StagingResult } from "../values/StagingResult.js"

// Witness: a minimal builder advanced through all prerequisites.
const witness = createEncodingSegment(
   createArtworkEngineSegment(createPipeline()),
)

// Placeholder blueprint built from the witness, used only to derive the
// exported helper type via ReturnType.
const workerPoolBlueprint = createSegmentBlueprintFromBuilder(witness)
   .withContextSubject<FileStoreSelection>()
   .addVirtualFeature("stagingStrategy")
   .withContextSubject<PathTargetSelection>()
   .addVirtualFeature("stagedFilePath")
   .withContextSubject<StagingResult>()
   .addStep("stagingResult", {
      method: async (
         store: IFileStore,
         filePath: string,
         canvas: Buffer,
      ): Promise<StagingResult> => {
         const uri = await store.write(filePath, canvas, {
            contentType: "image/png",
         })
         return { status: 1, uri }
      },
      selectors: [
         // Used only for type extraction — runtime value is discarded.
         ["stagingStrategy", "selected"] as const,
         ["stagedFilePath", "selected"] as const,
         ["task", "pngData"] as const,
      ] as const,
   })

export type WorkerPoolSegmentHelper = ReturnType<
   typeof workerPoolBlueprint.buildHelper
>

export const createWorkerPoolSegment: WorkerPoolSegmentHelper =
   workerPoolBlueprint.buildHelper()
