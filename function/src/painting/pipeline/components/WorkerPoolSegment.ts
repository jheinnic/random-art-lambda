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

/** Virtual contract: the resolved file store to stage into. */
export interface FileStoreSelection {
   selected: IFileStore
}

/** Virtual contract: the resolved destination path for the staged file. */
export interface PathTargetSelection {
   selected: string
}

/** Output produced by the staging step. */
export interface StagingResult {
   status: number
   uri: string
}

interface StagingSelectors {
   stagingResult: readonly [
      readonly ["stagingStrategy", "selected"],
      readonly ["stagedFilePath", "selected"],
      "pngData",
   ]
}

// Witness: a minimal builder advanced through all prerequisites.
const witness = createEncodingSegment(
   createArtworkEngineSegment(createPipeline()),
)

// Placeholder blueprint built from the witness, used only to derive the
// exported helper type via ReturnType.
const workerPoolBlueprint = createSegmentBlueprintFromBuilder(witness)
   .addVirtualFeature<FileStoreSelection, "stagingStrategy">("stagingStrategy")
   .addVirtualFeature<PathTargetSelection, "stagedFilePath">("stagedFilePath")
   .addStep<StagingResult, "stagingResult", StagingSelectors["stagingResult"]>(
      "stagingResult",
      {
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
            "pngData",
         ] as const,
      },
   )

export type WorkerPoolSegmentHelper = ReturnType<
   typeof workerPoolBlueprint.buildHelper
>

export const createWorkerPoolSegment: WorkerPoolSegmentHelper =
   workerPoolBlueprint.buildHelper()

// export function createWorkerPoolSegment(
//    configSvc: ConfigService,
// ): WorkerPoolSegmentHelper {
//    // Witness chain: advance a minimal builder through all prerequisites.
//    const witness = createPermutationSegment(configSvc)(
//       createEncodingSegment(configSvc)(
//          createPipeline<WorkerPoolMinimalIC>().addPrivateInjection<
//             IFileStore,
//             "fileStore"
//          >("fileStore"),
//       ),
//    )

//    return createSegmentBlueprintFromBuilder(witness)
//       .addVirtualFeature<FileStoreSelection, "stagingStrategy">(
//          "stagingStrategy",
//       )
//       .addVirtualFeature<PathTargetSelection, "stagedFilePath">(
//          "stagedFilePath",
//       )
//       .addStep<
//          StagingResult,
//          "stagingResult",
//          StagingSelectors["stagingResult"]
//       >("stagingResult", {
//          method: async (
//             store: IFileStore,
//             filePath: string,
//             canvas: Buffer,
//          ): Promise<StagingResult> => {
//             const uri = await store.write(filePath, canvas, {
//                contentType: "image/png",
//             })
//             return { status: 1, uri }
//          },
//          selectors: [
//             ["stagingStrategy", "selected"] as const,
//             ["stagedFilePath", "selected"] as const,
//             "canvasBuffer",
//          ] as const,
//       })
//       .buildHelper()
// }
