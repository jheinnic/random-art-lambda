/**
 * WorkerPoolSegment — code-injecting segment helper.
 *
 * Declares the virtual `stagingStrategy` and `stagedFilePath` contracts and
 * registers the `stagingResult` step.  The step reaches the injected file store
 * through the `stagingStrategy` virtual via selector indirection.
 *
 * Precondition: the caller must have placed `fileStore: IFileStore` into the
 * builder context (via addPrivateInjection) before this segment is applied.
 *
 * Runtime pruning: if an application's assembly never fulfills `stagingStrategy`,
 * the step is skipped and `stagingResult` is absent from the pipeline output.
 */

import type { ConfigService } from "@nestjs/config"
import type { IFileStore } from "../../interface/IFileStore.js"
import { createSegmentBlueprint } from "../../../pipeline/index.js"

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

type StagingSelectors = {
   stagingResult: readonly [
      readonly ["stagingStrategy", "selected"],
      readonly ["stagedFilePath", "selected"],
      "canvasBuffer",
   ]
}

type StagingRequiredAC = {
   fileStore: IFileStore
   canvasBuffer: Buffer
}

// Placeholder blueprint used only to derive the helper's type signature.
const _workerPoolBlueprint = createSegmentBlueprint()
   .requiresInContext<StagingRequiredAC>()
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
            ["stagingStrategy", "selected"] as const,
            ["stagedFilePath", "selected"] as const,
            "canvasBuffer",
         ] as const,
      },
   )

export type WorkerPoolSegmentHelper = ReturnType<
   typeof _workerPoolBlueprint.buildHelper
>

// ConfigService accepted for API consistency; no keys read currently.
export function createWorkerPoolSegment(
   _configSvc: ConfigService,
): WorkerPoolSegmentHelper {
   return createSegmentBlueprint()
      .requiresInContext<StagingRequiredAC>()
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
               ["stagingStrategy", "selected"] as const,
               ["stagedFilePath", "selected"] as const,
               "canvasBuffer",
            ] as const,
         },
      )
      .buildHelper()
}
